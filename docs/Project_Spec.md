# Project Spec

## Project

**game.namnth.com** - Bộ sưu tập mini game chạy hoàn toàn bằng HTML, CSS
và JavaScript.

## Mục tiêu

-   Chạy 100% static trên Cloudflare Pages.
-   Mobile-first, responsive.
-   Không cần backend.
-   Không đăng nhập.
-   Không lưu dữ liệu server.
-   Mỗi game hoàn thiện, dễ chơi trong 1-5 phút.

## Tech Stack

-   HTML
-   CSS
-   JavaScript (Vanilla)
-   Canvas API (khi cần)
-   localStorage
-   Không dùng framework.

## Game

1.  Rắn Săn Mồi (lấy cảm hứng từ Snake)
2.  Phá Gạch (lấy cảm hứng từ Brick Breaker)
3.  Đạo Quân Tí Hon (lấy cảm hứng từ Stick War)
4.  Lật Thẻ Ghi Nhớ (lấy cảm hứng từ Memory Cards)
5.  Ghép Số 2048 (lấy cảm hứng từ 2048)
6.  Chiến Cơ Không Gian (lấy cảm hứng từ Space Shooter)
7.  Chạy Bất Tận (lấy cảm hứng từ Mario)
8.  Thủ Thành Khu Vườn (lấy cảm hứng từ Plants vs Zombies)
9.  Ná Cao Su (lấy cảm hứng từ Angry Birds)

## Đạo Quân Tí Hon

-   Thợ Mỏ
-   Kiếm Sĩ
-   Cung Thủ
-   Khiên Binh
-   Khổng Lồ

## Yêu cầu chung

-   UI hiện đại, tối giản.
-   Hiệu ứng mượt.
-   Có hướng dẫn ngắn.
-   Pause / Chơi lại.
-   Âm thanh bật/tắt.
-   Responsive.
-   Lưu điểm cao bằng localStorage.
-   Mỗi game độc lập, dễ bảo trì.

## Cấu trúc

``` text
/
├── index.html
├── assets/
├── shared/
└── games/
    ├── snake/
    ├── brick-breaker/
    ├── tiny-army/
    ├── memory/
    ├── merge-2048/
    ├── shooter/
    ├── runner/
    ├── garden-defense/
    └── slingshot/
```

### Thương hiệu và thiết kế

- Dùng wordmark dạng chữ "namnth" làm thương hiệu chính, có customize cho phù hợp với web game
- Màu thương hiệu: `#10b981`.
- Giao diện sáng là mặc định, nền trắng.
- Có nút chuyển theme sáng/tối, nền tối màu đen.
- Nội dung thuần tiếng Việt.
- Phong cách đơn giản, ngắn gọn, thẳng vào vấn đề.
- Trang đầu không quá nhiều chi tiết, chỉ list các game
- Có note phân loại các game theo:
    - 🎮 Arcade (Rắn Săn Mồi, Phá Gạch, Chiến Cơ Không Gian, Chạy Bất Tận)
    - 🧠 Trí tuệ (Ghép Số 2048, Lật Thẻ Ghi Nhớ)
    - ⚔️ Chiến thuật (Đạo Quân Tí Hon, Thủ Thành Khu Vườn, Ná Cao Su)
- Giao diện gọn gàng ngăn nắp và mỗi section nằm gọn trong một trang đối với chế độ Desktop
- Không quá nhiều chữ

## Nguyên tắc

-   Ưu tiên trải nghiệm người chơi.
-   Code đơn giản, dễ đọc.
