# INPUT

Dựa trên Project_Spec.md đính kèm.

# TASK

Tạo game Đạo Quân Tí Hon (lấy cảm hứng từ Stick War):
- Nguyên lý hoạt động về cơ bản giống game Stick War.
- Màu thân của các nhân vật có màu thương hiệu: `#10b981`.
- Background đẹp chút (có núi non, bụi cây, mây, mặt trời)
- Căn cứ của quân ta là lâu đài, căn cứ của địch thay đổi theo từng màn (hang, doanh trại, pháo đài, lâu đài, ngọn núi,...)
- Có 5 loại quân:
   - Thợ Mỏ: Đào vàng liên tục, không chiến đấu.
   - Kiếm Sĩ: Máu trung bình, sát thương khá, di chuyển nhanh.
   - Cung Thủ: Bắn xa, máu thấp.
   - Khiên Binh: Máu cao, chặn sát thương, sát thương cao, di chuyển chậm.
   - Khổng Lồ: Máu cực nhiều, Sát thương mạnh và lan ra một khoảng, di chuyển chậm và tốc độ đánh chậm, Giá tiền cao.
- Máu: Khổng Lồ > Khiên Binh > Kiếm Sĩ = Thợ Mỏ > Cung Thủ
- Tốc độ di chuyển: Kiếm Sĩ > Cung Thủ = Thợ Mỏ > Khiên Binh > Khổng Lồ
- Tốc độ đánh: Kiếm Sĩ = Cung Thủ > Khiên Binh > Khổng Lồ
- Khoảng cách đánh: Cung Thủ > Khổng Lồ > Khiên Binh > Kiếm Sĩ
- Giá tiền: Khổng Lồ > Khiên Binh > Cung Thủ > Kiếm Sĩ > Thợ Mỏ
- Thời gian huấn luyện (từ lúc ấn triển khai đến lúc đi ra khỏi lâu đài): Khổng Lồ > Khiên Binh > Cung Thủ > Kiếm Sĩ > Thợ Mỏ
- Có 2 chế độ: vượt ải và bất ngờ.
- Chế độ vượt ải gồm 10 ải với độ khó tăng dần. Ải cuối có 1 Khổng Lồ địch to x2, nhiều máu x2, sát thương x2.
- Qua mỗi ải được có thêm một bùa chú: bùa thợ mỏ (thợ mỏ khai thác nhanh x2), bùa cung thủ (cung thủ triệu hồi mưa tên rơi xuống chiến trường), bùa kiếm sĩ (kiếm của kiếm sĩ nổi lửa và gây x2 sát thương), bùa khiên binh (giáp của khiên binh hóa vàng giảm x2 sát thương nhận vào), bùa khổng lồ (kích thước khổng lồ to hơn 1,5 lần máu tăng 1,5 lần), các vòng 5 - 10 mỗi lần thêm lần lượt một lượt bùa chú nữa
- Khi chết hiện Chơi lại màn, Lại từ đầu và Chọn chế độ.
- Khi người dùng ấn Space hoặc Enter sẽ tự động Chơi lại màn khi thua hoặc chơi màn tiếp khi thắng.
- Chế độ bất ngờ giống chế độ vượt ải nhưng các bùa chú được sử dụng vô hạn.

# DESIGN RULES

* Game chạy hoàn toàn bằng HTML, CSS và JavaScript
* Đảm bảo responsive cho desktop, tablet và mobile.
* Đảm bảo màu chữ có độ tương phản tốt.
* Vùng bấm trên mobile phải đủ lớn.
* Không lạm dụng animation, gradient, shadow, card hoặc border-radius.
* Game không cần âm thanh
* Phong cách trình bày đơn giản
* Tham khảo các giao diện game chuyên nghiệp trên thị trường, sử dụng thiết kế hiện đại, hợp mắt người xem.
* Self-host bộ icon.

# OUTPUT

Tạo giao diện chạy được bằng HTML, JS, CSS lưu trong thư mục theo cấu trúc của Project_Spec.md. Tuân thủ quy định về coding convention trong [code_folder.md](../docs/code_folder.md)
