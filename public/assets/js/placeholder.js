"use strict";

const PLACEHOLDER_GAMES = {
  "brick-breaker": { name: "Phá Gạch", category: "Arcade", symbol: "▦", copy: "Đập sạch các khối gạch bằng những cú nảy chính xác." },
  "tiny-army": { name: "Đạo Quân Tí Hon", category: "Chiến thuật", symbol: "♟", copy: "Khai thác tài nguyên, xây đội hình và tiến về phía trước." },
  memory: { name: "Lật Thẻ Ghi Nhớ", category: "Trí tuệ", symbol: "?", copy: "Ghi nhớ vị trí và tìm tất cả các cặp thẻ giống nhau." },
  "merge-2048": { name: "Ghép Số 2048", category: "Trí tuệ", symbol: "2ⁿ", copy: "Trượt, ghép và đưa con số của bạn lên thật cao." },
  shooter: { name: "Chiến Cơ Không Gian", category: "Arcade", symbol: "▲", copy: "Điều khiển chiến cơ và vượt qua những làn đạn ngoài không gian." },
  runner: { name: "Chạy Bất Tận", category: "Arcade", symbol: "↗", copy: "Chạy, nhảy và phá kỷ lục trên một hành trình không dừng lại." },
  "garden-defense": { name: "Thủ Thành Khu Vườn", category: "Chiến thuật", symbol: "✿", copy: "Sắp xếp đội hình cây xanh để bảo vệ khu vườn của bạn." },
  slingshot: { name: "Ná Cao Su", category: "Chiến thuật", symbol: "Y", copy: "Căn góc, kéo ná và đánh trúng mục tiêu với ít lượt nhất." },
};

const game = PLACEHOLDER_GAMES[document.body.dataset.game];

if (game) {
  document.title = `${game.name} - Sắp ra mắt | namnth games`;
  document.querySelector("#placeholderCategory").textContent = game.category;
  document.querySelector("#placeholderTitle").textContent = game.name;
  document.querySelector("#placeholderCopy").textContent = game.copy;
  document.querySelector("#placeholderSymbol").textContent = game.symbol;
}
