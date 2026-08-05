# Integration Prompts

# Giai đoạn 1 — Xử lý form và lưu lead

## Prompt 1.1 — Audit và triển khai form production

### ROLE

Bạn là Senior Front-end Engineer và Cloudflare Pages Developer.

### INPUT
- Domain production: `https://landing.example.com`
- Static output: `public/`
- Pages Functions: `functions/`
- Nơi lưu lead: Google Sheet qua Google Apps Script
- Không gửi password, API token, credential hoặc secret thật trong prompt.
- Nếu thiếu ID/URL/secret, dùng placeholder rõ nghĩa và hướng dẫn người dùng tự cấu hình.

Đọc đầy đủ:

- `docs/Landing_Page_Brief.md`
- `docs/code_folder.md`
- `docs/Privacy_Notice.md`
- `docs/Service_Policy.md`
- `public/index.html`
- `public/assets/js/main.js`
- Source hiện có trong `functions/`, `integrations/`, `tests/` và `package.json`

Luồng cần hoàn thành:

```text
Form -> POST /api/leads -> Cloudflare Pages Function
     -> Google Apps Script -> Google Sheet
```

Payload chỉ gồm các trường đã có trên form và dữ liệu nguồn truy cập cần thiết:

```text
name, contactMethod, contactValue, businessType, currentUrl,
primaryGoal, interestedPackage, note, consent, pageUrl, referrer,
utmSource, utmMedium, utmCampaign, utmContent, utmTerm, submittedAt
```

### CONSTRAINTS

- Giữ nguyên UI, copy, section, class và ID hiện tại nếu không bắt buộc phải đổi.
- Không thêm framework hoặc dependency lớn; ưu tiên JavaScript thuần.
- Frontend chỉ báo success khi backend xác nhận đã lưu lead.
- Khi request lỗi: giữ nguyên dữ liệu, hiển thị lỗi dễ hiểu và cho gửi lại.
- Disable nút và chặn double submit khi request đang chạy.
- Validation phải có ở cả frontend, Pages Function và Apps Script.
- Pages Function chỉ nhận `POST`, parse JSON an toàn, trim input, giới hạn độ dài, kiểm tra consent và origin.
- Chống spam nhẹ bằng honeypot, thời gian điền form, rate limit best-effort và giới hạn body; chưa dùng CAPTCHA.
- Không log PII; không trả stack trace; không đưa Apps Script URL hoặc shared secret vào frontend.
- Dùng Google Apps Script làm upstream. Secret truyền giữa Cloudflare và Apps Script phải được kiểm tra ở server.
- Chống formula injection trước khi ghi Sheet và dùng lock khi append row.
- Notification chỉ được ghi `sent` khi gửi thật; nếu chưa cấu hình phải ghi `not_configured`.
- Accessibility: lỗi gắn đúng input, có `aria-live`, focus vào lỗi đầu tiên hoặc success panel.
- Giữ `public/` là static output và `functions/` ở repository root.
- Không deploy nếu người dùng chưa yêu cầu rõ ràng.

### OUTPUT

Thực hiện thay đổi tối thiểu, chạy test, rồi trả về đúng các phần sau:

1. **Files changed** — file tạo/sửa và mục đích.
2. **Automated checks** — lệnh đã chạy và kết quả; tối thiểu có syntax check, endpoint tests và `git diff --check`.
3. **Environment variables**:

   ```text
   Cloudflare secrets:
   GOOGLE_SCRIPT_URL
   GOOGLE_SCRIPT_SHARED_SECRET

   Cloudflare variables:
   ALLOWED_ORIGIN=https://landing.example.com
   RATE_LIMIT_MAX_REQUESTS=5
   RATE_LIMIT_WINDOW_SECONDS=60
   MIN_FORM_FILL_TIME_MS=1500
   UPSTREAM_TIMEOUT_MS=8000
   ```

4. **Manual setup** — hướng dẫn cụ thể, không chỉ liệt kê tên việc:

   - Tạo Google Sheet và tab `Leads`; chỉ rõ Sheet ID là đoạn giữa `/d/` và `/edit` trong URL.
   - Copy `integrations/google-apps-script/Code.gs` vào Apps Script.
   - Tạo Script Properties và giải thích giá trị của từng property:

     ```text
     GOOGLE_SHEET_ID
     LEADS_SHEET_NAME
     INBOUND_SHARED_SECRET
     LEAD_NOTIFICATION_EMAIL
     ```

   - Cung cấp lệnh PowerShell tạo shared secret ngẫu nhiên; nhắc dùng cùng một giá trị cho `INBOUND_SHARED_SECRET` và `GOOGLE_SCRIPT_SHARED_SECRET`.
   - Deploy Apps Script dạng Web App: **Execute as Me**, **Who has access: Anyone**; lấy URL `/exec` cho `GOOGLE_SCRIPT_URL`.
   - Chỉ rõ đường dẫn thêm Variables and Secrets trong Cloudflare Pages và yêu cầu redeploy sau khi lưu.
   - Cấu hình Pages: root repository, build command `exit 0`, output `public`, branch `main`.
   - Gắn custom domain `landing.example.com`; CNAME `landing` trỏ tới `landing-example-com.pages.dev` nếu Cloudflare không tự tạo.

5. **Quick test** — hướng dẫn và kết quả mong đợi:

   - `GET /api/leads` phải trả JSON `405`; đây là đúng vì endpoint chỉ nhận `POST`.
   - Submit một lead test từ UI phải tạo đúng một row trong Sheet và chỉ khi đó mới hiện success.
   - Double-click nút gửi không được tạo hai row.
   - Bật Network Offline rồi submit phải hiện error và giữ nguyên dữ liệu.
   - Kiểm tra `notificationStatus` là `sent`, `failed` hoặc `not_configured` đúng với cấu hình thật.
   - Không có secret hoặc PII trong Console và response body.

6. **Manual work remaining** — ghi rõ việc nào AI chưa thể làm vì cần quyền Google/Cloudflare.

Không đánh dấu hoàn thành trước khi người dùng xác nhận có một lead test thật trong Google Sheet.

---

## Prompt 1.2 — Chẩn đoán sau khi cấu hình tài khoản (Nếu lỗi)

### ROLE

Bạn là Senior Integration Engineer

### INPUT

Người dùng đã thực hiện setup thủ công và cung cấp các trạng thái không nhạy cảm sau:

```text
Pages deployment URL:
Custom domain status:
GET /api/leads response:
Form error message:
HTTP status của POST /api/leads:
Google Apps Script deployment status:
Google Sheet có row mới hay không:
notificationStatus:
Cloudflare Function log đã lược bỏ PII:
Ảnh lỗi đã che PII:
```

### CONSTRAINTS

- Không yêu cầu người dùng gửi secret, Apps Script URL đầy đủ, credential hoặc dữ liệu lead thật.
- Không sửa UI và không refactor ngoài nguyên nhân lỗi.
- Phân biệt rõ lỗi frontend, Pages Function, environment, origin, Apps Script, Sheet và DNS.
- Không coi `GET /api/leads` trả `405` là lỗi.
- Không mô phỏng success và không bỏ validation để làm test pass.
- Chỉ sửa code khi có bằng chứng lỗi thuộc source; lỗi tài khoản/DNS phải hướng dẫn thao tác thủ công.

### OUTPUT

1. Nêu một nguyên nhân chính có bằng chứng và lớp đang lỗi.
2. Nếu cần sửa code: liệt kê diff nhỏ nhất, chạy lại `npm run check` và không deploy khi chưa được yêu cầu.
3. Nếu cần thao tác thủ công: chỉ đúng màn hình, tên field và giá trị dạng placeholder.
4. Giải thích nhanh các trường hợp phổ biến:

   - `Hello World`: đang truy cập Worker, không phải Pages Function.
   - `405` khi mở endpoint bằng trình duyệt: route đúng, nhưng trình duyệt đang gửi `GET`.
   - `403`: `ALLOWED_ORIGIN` không khớp origin production.
   - `422`: honeypot hoặc thời gian điền form không hợp lệ.
   - `429`: rate limit.
   - `502`: Apps Script lỗi, URL/secret không khớp hoặc Sheet config sai.
   - `503`: thiếu Cloudflare secret.
   - Custom domain Active nhưng chưa mở được: kiểm tra CNAME bằng `nslookup landing.example.com 1.1.1.1`, flush DNS và chờ cache hết hạn.

5. Cung cấp đúng một luồng retest: mở domain production -> submit lead test -> kiểm tra Network -> kiểm tra một row trong Sheet -> kiểm tra trạng thái notification.

---

# Giai đoạn 2 — Tích hợp GA4 và lưu thông tin UTM

## Prompt 2.1 — Triển khai GA4 và hoàn thiện attribution

### ROLE

Bạn là Web Analytics Engineer và Front-end Engineer.

### INPUT

Đọc source và tài liệu hiện tại. Trước khi sửa, xác nhận lại trạng thái thực tế:

- UTM hiện được đọc từ `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`.
- Attribution hiện được lưu trong `sessionStorage` với key `landing-template-attribution` và gửi cùng lead.
- `pageUrl` và referrer được lưu cùng attribution rồi gửi về Sheet.
- GA4 hiện chưa được cài đặt.
- Website là static site, không có build step để tự inject Cloudflare runtime environment variable vào frontend.
- GA4 Measurement ID do người dùng tạo, dạng `G-...`; đây là public identifier, không phải secret.

### CONSTRAINTS

- Giữ nguyên UI, copy, section và hành vi form đã chạy production.
- Không làm lại logic UTM nếu logic hiện tại đúng; chỉ sửa bug hoặc bổ sung test còn thiếu.
- Dùng `gtag.js` trực tiếp, không thêm Tag Manager hay dependency nếu chưa được yêu cầu.
- Measurement ID chỉ nằm ở một public config location có placeholder rõ ràng. Không giả định Cloudflare secret tự xuất hiện trong static JavaScript.
- Nếu chưa có ID hợp lệ, website vẫn hoạt động và không gửi analytics.
- Không gửi vào GA4: họ tên, email, số điện thoại, link người dùng nhập, note, nội dung form, full referrer hoặc payload API.
- Không dùng form values làm event parameter. `contact_method` chỉ được phép là loại kênh (`zalo`, `phone`, `email`), không phải contact value.
- UTM cũng không được chứa PII; không dùng email/số điện thoại trong tên campaign/content/term.
- Event chỉ fire một lần tại đúng thời điểm; `lead_form_success` chỉ fire sau response backend `success: true`.
- Không cài Microsoft Clarity hoặc Meta Pixel.
- Đối chiếu Privacy Notice; nếu tài liệu nói đang dùng công cụ chưa được cài, phải báo rõ và xin xác nhận trước khi sửa policy.
- Không deploy khi chưa được yêu cầu.

Event cần triển khai:

| Event | Thời điểm | Parameter cho phép |
| --- | --- | --- |
| `cta_click` | Click CTA mở form | `cta_location`, `package_name` |
| `lead_form_open` | Modal form mở | `cta_location`, `package_name` |
| `lead_form_start` | Tương tác đầu tiên với form | `contact_method` |
| `lead_form_submit` | Form hợp lệ bắt đầu gửi | `package_name`, `contact_method` |
| `lead_form_success` | Backend xác nhận lưu lead | `package_name`, `contact_method` |
| `lead_form_error` | Validation hoặc request lỗi | `error_stage` |
| `contact_click` | Click email/điện thoại | `contact_method`, `link_location` |
| `template_click` | Click template | `template_name`, `link_location` |

### OUTPUT

1. **Current state** — logic UTM nào được giữ, GA4 còn thiếu gì.
2. **Files changed** — thay đổi nhỏ, tách helper analytics khỏi logic form nếu giúp tránh gửi PII và tránh event trùng.
3. **Event map** — selector, event, thời điểm và parameter thực tế cho từng event.
4. **Automated checks** — syntax, unit tests cho UTM/event guard, `npm run check` và `git diff --check`.
5. **Manual GA4 setup** — hướng dẫn cụ thể:

   - Vào Google Analytics -> Admin -> Create Property.
   - Tạo Web Data Stream với URL `https://landing.example.com`.
   - Copy Measurement ID dạng `G-...` từ Stream details.
   - Chỉ rõ file/public config duy nhất cần điền ID, sau đó commit và deploy lại Pages.
   - Trong GA4 Admin -> Events/Key events, đánh dấu `lead_form_success` là key event sau khi event xuất hiện.
   - Dùng Tag Assistant để bật debug cho đúng thiết bị.

6. **Quick GA4/UTM test**:

   - Mở URL:

     ```text
     https://landing.example.com/?utm_source=facebook&utm_medium=social&utm_campaign=launch_test&utm_content=post_01
     ```

   - Click CTA, mở form, tương tác, submit đúng một lead test.
   - Trong GA4 DebugView phải thấy event theo thứ tự hợp lý và chỉ một `lead_form_success`.
   - Trong Realtime phải thấy thiết bị/event; dữ liệu báo cáo thường không tức thời như DebugView.
   - Trong Sheet, row test phải có `utmSource=facebook`, `utmMedium=social`, `utmCampaign=launch_test`, `utmContent=post_01`.
   - Chuyển sang trang khác rồi quay lại trong cùng session; UTM không được biến mất hoặc bị ghi đè bằng chuỗi rỗng.
   - Kiểm tra Network request tới Google không chứa name, email, phone, note, contact value hoặc link do người dùng nhập.

7. **Manual work remaining** — GA4 account actions, Measurement ID, key event và Privacy Notice chưa thể tự xác nhận.

---

## Prompt 2.2 — Xác minh GA4/UTM trên production

### ROLE

Bạn là Web Analytics QA Engineer.

### INPUT

Người dùng cung cấp kết quả không chứa PII:

```text
Production URL:
Measurement ID status (chỉ cần “đã cấu hình/chưa cấu hình”):
Tag Assistant connected:
DebugView events nhìn thấy:
Số lần lead_form_success:
Realtime events nhìn thấy:
UTM test URL:
Các cột UTM trong row test:
Network/Console error:
Privacy Notice đã khớp công cụ thực tế hay chưa:
```

### CONSTRAINTS

- Không yêu cầu screenshot chứa dữ liệu lead, cookie ID hoặc credential.
- Không dùng Realtime làm bằng chứng duy nhất; ưu tiên DebugView cho event-level debugging.
- Không gửi event test chứa PII.
- Không sửa form production đang hoạt động nếu lỗi chỉ thuộc GA4 configuration/ad blocker.
- Không đánh dấu xong khi event trùng, UTM sai hoặc Privacy Notice liệt kê công cụ chưa dùng.

### OUTPUT

1. Bảng PASS/FAIL cho: tag load, từng event, chống trùng, UTM trong Sheet, không có PII và Privacy Notice.
2. Với mỗi FAIL, nêu lớp lỗi: source, Measurement ID/config, consent/ad blocker, GA4 property hoặc deployment cache.
3. Đưa ra sửa đổi nhỏ nhất hoặc bước manual cụ thể.
4. Cung cấp một retest duy nhất bằng cửa sổ Incognito, Tag Assistant và URL UTM test.
5. Chỉ coi Giai đoạn 2 hoàn thành khi:

   - DebugView nhận đúng events và chỉ một success cho một lead.
   - Lead test có đúng UTM/referrer trong Sheet.
   - Không có PII trong GA4 request.
   - `lead_form_success` đã được đánh dấu key event nếu người dùng muốn đo conversion.
   - Privacy Notice phản ánh đúng các công cụ thực sự đang chạy.

---

