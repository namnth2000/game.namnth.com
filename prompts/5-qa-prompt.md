# Prompt

```markdown
# ROLE

Bạn là Senior QA Engineer chuyên kiểm thử Landing Page.

# INPUT

Dựa trên:

* Landing Page Brief đã duyệt
* Source code hiện tại
* Các chức năng Integration đã triển khai
* Domain staging hoặc production được cung cấp

# TASK

Phân tích Landing Page và tạo danh sách các testcase manual quan trọng nhất trước khi Launch.

Đây là sản phẩm nhỏ. Không tạo bộ testcase toàn diện, không tạo test automation và không kiểm tra những tình huống hiếm gặp.

Chỉ tập trung vào các lỗi có thể:

* Làm người dùng không gửi được form
* Làm mất lead
* Lưu sai dữ liệu
* Làm website vỡ trên mobile
* Làm CTA hoặc liên kết không hoạt động
* Làm tracking sai hoặc ghi nhận trùng
* Làm lộ dữ liệu cá nhân hoặc secret

# TEST SCOPE

Tạo tối đa 15 testcase, ưu tiên:

1. Trang tải và hiển thị nội dung chính.
2. CTA chính mở đúng form.
3. Validation các trường bắt buộc.
4. Gửi form hợp lệ.
5. Dữ liệu được lưu đúng vào Google Sheet.
6. Trạng thái loading trong khi gửi.
7. Trạng thái success sau khi backend xác nhận.
8. Trạng thái error khi backend thất bại.
9. Không mất dữ liệu khi gửi lỗi.
10. Không gửi form hai lần.
11. UTM và referrer được lưu đúng.
12. GA4 ghi nhận CTA và form success.
13. Event không bị ghi nhận trùng.
14. Giao diện và form hoạt động trên mobile.
15. Các liên kết quan trọng không bị lỗi.

# OUTPUT FORMAT

Trình bày dưới dạng bảng:

| ID | Mức độ | Testcase | Các bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
| -- | ------ | -------- | ------------------ | ---------------- | --------------- | ---------- |

Quy tắc:

* Chỉ dùng mức độ Critical, High hoặc Medium.
* Sắp xếp testcase quan trọng nhất lên trước.
* Các bước thực hiện phải ngắn và đủ rõ để người không chuyên QA vẫn test được.
* Không viết testcase trùng nhau.
* Không tạo testcase cho chức năng chưa tồn tại.
* Đánh dấu rõ testcase nào cần kiểm tra trên mobile.
* Để trống cột Kết quả thực tế và Trạng thái để người dùng điền thủ công.

Sau bảng, cung cấp thêm:

## Test Environment

* Trình duyệt nên kiểm tra
* Kích thước màn hình tối thiểu
* Dữ liệu test mẫu cần chuẩn bị

## Launch Blockers

Liệt kê những lỗi khiến Landing Page chưa được phép Launch, ví dụ:

* Không gửi được form
* Lead không xuất hiện trong Google Sheet
* Success giả dù backend lỗi
* Dữ liệu cá nhân bị gửi vào GA4
* Giao diện mobile không thể sử dụng
* CTA chính hoặc trang chính sách bị lỗi
```
