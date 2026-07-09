# handcraft-marker: implementation notes

Skin token: [`src/lib/skins.ts`](../../../src/lib/skins.ts) id `handcraft-marker`. Đây là ghi chú để dựng chữ ký "vẽ dần" và tinh chỉnh skin. Preview trực quan: `style-frames.html` (mở trình duyệt, kéo xuống để xem nét tự vẽ, có nút "Vẽ lại"). Mood: kênh faceless "từng trải", triết lí / đạo đức kinh doanh / lối sống.

## Palette (khóa cứng)

| Vai trò | Hex |
|---|---|
| Nền giấy (gradient) | `#f0e7d3` tới `#e7dcc2` (token bg = `#E7DCC2`) |
| Mực chính (walnut) | `#3A2C22` |
| Accent (ochre) | `#C58A2A` |
| Caption | `#7A5A2A` |

## Nét tay (rough)

- SVG filter: `feTurbulence baseFrequency=0.018 numOctaves=2 seed=7` + `feDisplacementMap scale=3.4`.
- Stroke width 4 tới 4.5, `stroke-linecap: round`.
- Chữ dùng `PatrickHand` (VN-safe, đã dùng ở notebook/chalkboard). Độ đậm lấy từ nét minh họa và gạch chân, không từ font.

## Motion "vẽ dần" (PHẢI dựng thành primitive)

Đây là phần engine còn thiếu, cần thành component tái dùng trong render-remotion + ghi vào `SCENE-DESIGN.md`.

- `stroke-dashoffset`: đặt `stroke-dasharray = pathLength`, `offset = pathLength`, transition `offset -> 0` (~1.05s, ease `cubic-bezier(.6,.02,.3,1)`).
- Stagger 0.14s mỗi nét theo thứ tự vẽ.
- Đường mòn (trail) đi bằng nét đứt `stroke-dasharray "1 11"`.
- Fill (cờ, chấm mực) pop vào SAU khi nét xong (opacity + scale từ .6).
- Đồng bộ theo lời: nét chạy đúng lúc narrator nói tới ý đó.
- `prefers-reduced-motion`: hiện thẳng trạng thái đã vẽ, không animate.

## Motif minh họa

- Ẩn dụ hành trình: đường lượn vẽ dần lên đồi, cắm cờ, mặt trời.
- Nhóm tái dùng: đường / đồi / cờ / cây-rễ / la bàn / mũi tên / cột mốc.

## Legibility

Mạnh nhất trong họ vẽ tay: nét đậm trên nền sáng, đọc nhanh khi lướt phone.

## Biến thể

- **Bút kim mảnh (fine-liner), để dành, CHƯA cắm skins.ts.** Nền `#f7f6f1`, ink `#22231f`, accent ink-blue `#35507e`, stroke 2 tới 2.4, rough `baseFrequency=0.014 seed=3 scale=1.8`. Promote khi cần bài sâu ít chữ; nhớ tăng cỡ chữ kẻo nét mảnh mờ trên phone. Motif: cây rễ sâu.
- **Phấn (chalk): KHÔNG cắm.** Dùng skin có sẵn `chalkboard` trong skins.ts (gần trùng). Motif la bàn có thể mượn qua đó.
