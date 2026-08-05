# 1. Quy ước comment trong `index.html`

Nên đánh số và dùng tên section nhất quán:

```html
<body>
    <!-- ==================== 01. HEADER ==================== -->
    <header class="header">
        <nav class="navigation">
            ...
        </nav>
    </header>
    <!-- ==================== END HEADER ==================== -->

    <main>
        <!-- ==================== 02. HERO ==================== -->
        <section id="hero" class="hero">
            ...
        </section>
        <!-- ==================== END HERO ==================== -->

        <!-- ==================== 03. BENEFITS ==================== -->
        <section id="benefits" class="benefits">
            ...
        </section>
        <!-- ==================== END BENEFITS ==================== -->

        <!-- ==================== 04. TESTIMONIALS ==================== -->
        <section id="testimonials" class="testimonials">
            ...
        </section>
        <!-- ==================== END TESTIMONIALS ==================== -->

        <!-- ==================== 05. FINAL CTA ==================== -->
        <section id="final-cta" class="final-cta">
            ...
        </section>
        <!-- ==================== END FINAL CTA ==================== -->
    </main>

    <!-- ==================== 06. FOOTER ==================== -->
    <footer class="footer">
        ...
    </footer>
    <!-- ==================== END FOOTER ==================== -->
</body>
```

Một số quy tắc:

* Dùng `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` thay cho toàn bộ `<div>`.
* Comment chỉ đánh dấu section lớn, không comment từng thành phần nhỏ.
* Số thứ tự phải khớp với thứ tự xuất hiện trên trang.
* `id` dùng cho anchor và tracking.
* `class` dùng để viết CSS.
* Tiếp tục dùng BEM như `.hero__heading`, `.hero__image`, `.hero__cta`.

# 2. Cấu trúc CSS đề xuất

Với landing page tĩnh, cấu trúc cân bằng giữa đơn giản và dễ mở rộng là:

```text
assets/
└── css/
    ├── normalize.css
    ├── tokens.css
    ├── base.css
    ├── layout.css
    ├── components.css
    ├── sections/
    │   ├── header.css
    │   ├── hero.css
    │   ├── benefits.css
    │   ├── testimonials.css
    │   ├── final-cta.css
    │   └── footer.css
    └── utilities.css
```

Vai trò từng file:

| File             | Chứa gì                                             |
| ---------------- | --------------------------------------------------- |
| `normalize.css`  | Chuẩn hóa trình duyệt, không chỉnh sửa thường xuyên |
| `tokens.css`     | Màu sắc, font, spacing, radius, shadow              |
| `base.css`       | `html`, `body`, heading, paragraph, link, image     |
| `layout.css`     | Container, grid, section spacing                    |
| `components.css` | Button, card, form, badge, modal                    |
| `sections/*.css` | Style riêng của từng section                        |
| `utilities.css`  | Các class hỗ trợ nhỏ và tái sử dụng                 |

Thứ tự import:

```html
<link rel="stylesheet" href="./assets/css/normalize.css">
<link rel="stylesheet" href="./assets/css/tokens.css">
<link rel="stylesheet" href="./assets/css/base.css">
<link rel="stylesheet" href="./assets/css/layout.css">
<link rel="stylesheet" href="./assets/css/components.css">

<link rel="stylesheet" href="./assets/css/sections/header.css">
<link rel="stylesheet" href="./assets/css/sections/hero.css">
<link rel="stylesheet" href="./assets/css/sections/benefits.css">
<link rel="stylesheet" href="./assets/css/sections/testimonials.css">
<link rel="stylesheet" href="./assets/css/sections/final-cta.css">
<link rel="stylesheet" href="./assets/css/sections/footer.css">

<link rel="stylesheet" href="./assets/css/utilities.css">
```

# 3. Responsive CSS nên đặt ở đâu?

Nên đặt media query ngay cuối file của section tương ứng:

```css
/* ==================== HERO ==================== */

.hero {
    padding: var(--section-spacing) 0;
}

.hero__heading {
    font-size: var(--font-size-display);
}

/* Hero responsive */

@media (max-width: 768px) {
    .hero {
        padding: var(--section-spacing-mobile) 0;
    }

    .hero__heading {
        font-size: var(--font-size-heading-1);
    }
}
```

Không nên dồn toàn bộ responsive của mọi section xuống cuối `main.css`, vì sau này muốn sửa Hero phải tìm ở hai nơi khác nhau.

# Quy ước về tổ chức code

```text
CODE ORGANIZATION RULES

- Chia index.html thành các section có comment đánh số rõ ràng.
- Sử dụng semantic HTML: header, nav, main, section và footer.
- Sử dụng BEM cho tên class.
- ID chỉ dùng cho anchor, tracking và liên kết trực tiếp.
- CSS phải được chia thành tokens, base, layout, components và sections.
- Mỗi section có một file CSS riêng.
- Media query của section phải đặt trong chính file CSS của section đó.
- Không đặt toàn bộ style vào một file main.css lớn.
- Không viết inline CSS trừ trường hợp thật sự cần thiết.
- Không tạo selector phụ thuộc sâu vào cấu trúc HTML.
- Giữ nguyên thứ tự section giữa index.html và thư mục sections.
```
