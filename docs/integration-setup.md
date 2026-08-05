# Integration setup — landing.example.com

## Trạng thái

| Hạng mục | Trạng thái |
| --- | --- |
| Form -> Pages Function -> Google Sheet | Đã test production thành công |
| Email notification | Chạy khi có `LEAD_NOTIFICATION_EMAIL`; xem cột `notificationStatus` |
| UTM/referrer trong lead | Đã có trong code; cần test bằng URL UTM |
| GA4 | Chưa tích hợp |

```text
public/index.html -> POST /api/leads -> functions/api/leads.js
                  -> Google Apps Script -> Google Sheet
```

`public/` là static output. `functions/` phải ở repository root.

---

## Giai đoạn 1 — Form và Google Sheet

### A. Google Sheet và Apps Script

1. Tạo Google Sheet, đổi tên tab thành `Leads`.
2. Lấy Sheet ID là đoạn giữa `/d/` và `/edit`:

   ```text
   https://docs.google.com/spreadsheets/d/GOOGLE_SHEET_ID/edit
   ```

3. Tạo shared secret bằng PowerShell:

   ```powershell
   $secretBytes = New-Object byte[] 32
   $secretGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
   $secretGenerator.GetBytes($secretBytes)
   [Convert]::ToBase64String($secretBytes)
   $secretGenerator.Dispose()
   ```

4. Trong Sheet chọn **Extensions -> Apps Script**, copy `integrations/google-apps-script/Code.gs` vào editor.
5. Vào **Project Settings -> Script Properties** và thêm:

| Property | Giá trị |
| --- | --- |
| `GOOGLE_SHEET_ID` | ID ở bước 2 |
| `LEADS_SHEET_NAME` | `Leads` hoặc tên tab thực tế |
| `INBOUND_SHARED_SECRET` | Secret ở bước 3 |
| `LEAD_NOTIFICATION_EMAIL` | Email nhận thông báo; có thể bỏ qua |

6. Chọn **Deploy -> New deployment -> Web app**:

   ```text
   Execute as: Me
   Who has access: Anyone
   ```

7. Cấp quyền Sheet/Mail và copy Web App URL kết thúc bằng `/exec`.

Tab trống sẽ được tự tạo header khi có lead đầu tiên. Nếu sửa `Code.gs`, dùng **Deploy -> Manage deployments -> Edit -> New version -> Deploy**; Save không cập nhật version `/exec`.

### B. Cloudflare Variables and Secrets

Vào **Workers & Pages -> landing-example-com -> Settings -> Variables and Secrets**, chọn Production.

Secrets:

```text
GOOGLE_SCRIPT_URL=<Web App URL /exec>
GOOGLE_SCRIPT_SHARED_SECRET=<khớp INBOUND_SHARED_SECRET>
```

Variables:

```text
ALLOWED_ORIGIN=https://landing.example.com
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_SECONDS=60
MIN_FORM_FILL_TIME_MS=1500
UPSTREAM_TIMEOUT_MS=8000
```

Lưu xong phải deploy/retry deployment để Function nhận cấu hình mới. Không đưa các giá trị secret vào Git hoặc frontend.

### C. Cloudflare Pages và custom domain

Tạo project bằng **Workers & Pages -> Create application -> Pages -> Connect to Git**, không tạo Worker riêng.

```text
Root directory: repository root
Build command: exit 0
Build output directory: public
Production branch: main
```

Mở `https://landing-example-com.pages.dev/api/leads`. JSON dưới đây là kết quả đúng vì trình duyệt gửi `GET`, còn endpoint chỉ nhận `POST`:

```json
{"success":false,"message":"Phương thức không được hỗ trợ."}
```

Nếu thấy `Hello World`, bạn đang mở Worker thay vì Pages Function.

Để gắn domain: **Pages project -> Custom domains -> Set up a custom domain -> `landing.example.com`**. Nếu DNS record không được tạo tự động, thêm trong zone `example.com`:

```text
Type: CNAME
Name: landing
Target: landing-example-com.pages.dev
Proxy status: Proxied
TTL: Auto
```

Chờ **Active** và **SSL enabled**, rồi kiểm tra:

```powershell
nslookup landing.example.com 1.1.1.1
```

Nếu DNS công cộng có IP nhưng trình duyệt chưa vào được, chạy `ipconfig /flushdns`, thử Secure DNS `1.1.1.1`/mạng khác hoặc chờ cache hết hạn. `public/index.html` là đúng vị trí và không gây lỗi DNS.

### D. Chạy local và kiểm tra code

```powershell
Copy-Item .dev.vars.example .dev.vars
npx wrangler pages dev public
```

Điền Apps Script test URL và secret vào `.dev.vars`, sau đó mở `http://localhost:8788`. Không mở bằng `file://`.

```powershell
npm run check
```

### E. Test production nhanh

- Mở `https://landing.example.com` bằng Incognito và submit một lead test.
- `POST /api/leads` phải trả `200`, `success: true`, UI mới hiện success và Sheet có đúng một row.
- Double-click nút gửi không được tạo hai row.
- DevTools -> Network -> Offline rồi submit: UI hiện error, giữ dữ liệu và cho retry.
- Cột `notificationStatus`: `sent`, `failed` hoặc `not_configured` đúng với cấu hình thật.
- Console/response không chứa dữ liệu form, Apps Script URL hoặc shared secret.

### F. Tra lỗi nhanh

| Kết quả | Kiểm tra |
| --- | --- |
| `405` khi mở `/api/leads` | Bình thường: request là `GET` |
| `403` | `ALLOWED_ORIGIN` không khớp domain submit |
| `422` | Honeypot có giá trị hoặc submit quá nhanh |
| `429` | Vượt rate limit; chờ hết window |
| `502` | Kiểm tra Apps Script `/exec`, shared secret, Script Properties, tab/header và version deploy |
| `503` | Thiếu `GOOGLE_SCRIPT_URL` hoặc `GOOGLE_SCRIPT_SHARED_SECRET` |
| Lead có, email không gửi | Kiểm tra `LEAD_NOTIFICATION_EMAIL`, quyền MailApp và `notificationStatus` |

---

## Giai đoạn 2 — GA4 và UTM

### A. Test UTM đã có

Frontend đọc năm tham số UTM, lưu trong `sessionStorage` với key `landing-template-attribution`, giữ attribution trong cùng tab/session và gửi UTM, referrer, page URL cùng lead.

Mở URL sau và submit một lead test:

```text
https://landing.example.com/?utm_source=facebook&utm_medium=social&utm_campaign=launch_test&utm_content=post_01
```

Row mới phải có:

```text
utmSource=facebook
utmMedium=social
utmCampaign=launch_test
utmContent=post_01
```

Không đặt tên, email hoặc số điện thoại trong UTM.

### B. Tích hợp và test GA4

Source hiện chưa load Google tag. Chạy Prompt 2.1 trong `prompts/4-integration-prompts.md` trước, sau đó:

1. Vào [Google Analytics](https://analytics.google.com/) -> **Admin -> Create Property**.
2. Tạo Web Data Stream cho `https://landing.example.com`.
3. Copy Measurement ID dạng `G-...` và điền vào public config location do implementation tạo.
4. Commit/deploy lại Pages.
5. Dùng [Tag Assistant](https://tagassistant.google.com/) kết nối domain.
6. Test CTA -> mở form -> tương tác -> submit một lead.
7. Trong GA4 **DebugView**, kiểm tra event và chỉ một `lead_form_success`.
8. Kiểm tra **Realtime** và đánh dấu `lead_form_success` là **Key event** nếu dùng làm conversion.
9. Trong Network, bảo đảm analytics request không có name, email, phone, contact value, note hoặc link người dùng nhập.

Measurement ID là public, không phải secret. Site không có build step nên static JavaScript không tự đọc `GA4_MEASUREMENT_ID` từ Cloudflare runtime environment.

Event dự kiến:

```text
cta_click, lead_form_open, lead_form_start, lead_form_submit,
lead_form_success, lead_form_error, contact_click, template_click
```

Privacy Notice hiện liệt kê Google Analytics, Microsoft Clarity và Meta Pixel. Chỉ GA4 thuộc giai đoạn này; cần làm policy khớp công cụ thực tế, không tự cài thêm Clarity/Meta Pixel.

---

## Rollback và tài liệu chính thức

- Pages: **Deployments -> deployment ổn định -> Rollback to this deployment**.
- Apps Script: **Manage deployments -> Edit -> version ổn định -> Deploy**.
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Cloudflare Pages variables/secrets](https://developers.cloudflare.com/pages/functions/bindings/)
- [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Thiết lập GA4](https://support.google.com/analytics/answer/14183469)
- [GA4 DebugView](https://support.google.com/analytics/answer/7201382)
- [Tránh gửi PII vào GA4](https://support.google.com/analytics/answer/6366371)
