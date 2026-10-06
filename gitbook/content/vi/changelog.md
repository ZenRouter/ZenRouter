# Nhật ký thay đổi

## 0.9.7 — 2026-10-06

Phiên bản này tập hợp toàn bộ đợt bảo trì đã hợp nhất; việc tăng số phiên bản không thêm tính năng sản phẩm riêng. Yêu cầu **Node.js >=22.19.0**. Gói vẫn là `@joyccn/zenrouter`, lệnh vẫn là `zenrouter`.

### Danh mục và định danh ứng dụng khách

Thêm **120 mục nhà cung cấp/mô hình** (100 chat, 8 hình ảnh, 6 embedding, 6 TTS) và **342 bản ghi siêu dữ liệu có nguồn**; **827 mục lịch sử chưa được kiểm chứng riêng**. Phân biệt giới hạn, giá và giá trị chưa biết giữa API, IDE/OAuth và gói lập trình. Sửa bí danh nhà cung cấp/giá, giao thức mô hình, khả năng khám phá không cần xác thực, ID dùng chung giữa các loại dịch vụ, khả năng khai báo trực tiếp, giới hạn đầu vào/ngữ cảnh/đầu ra và giá ngữ cảnh dài/tùy chỉnh. Giá theo đơn vị khác không bị biến thành giá token; giá chưa biết không có nghĩa là miễn phí. Cập nhật định danh khách đã nghiên cứu và header Gemini/Copilot theo endpoint, không cấp thêm quyền beta.

### Suy luận và ghi nhận sử dụng

Giữ giới hạn đầu ra tường minh/nullable và chế độ suy nghĩ riêng của nhà cung cấp đến bước tuần tự hóa cuối; không âm thầm tăng giới hạn trả phí. Giữ trường suy luận Responses và khả năng xen kẽ thực tế của Claude, kể cả khi thử lại sau beta bị từ chối. Ghi nhận lần gọi hết ngân sách, cộng token suy nghĩ Gemini đúng một lần, giữ trạng thái chưa hoàn tất/đầu ra một phần/từ chối, tránh ghi hai lần khi hủy sau sự kiện kết thúc và phát lại combo bị hiểu nhầm là rỗng. Không thêm tự động thử lại với ngân sách lớn hơn. Codex OAuth, OpenCode Muse và Cursor vẫn không thực thi giới hạn API công khai; giới hạn token không phải tổng ngân sách tiền.

### Tìm kiếm có căn cứ

Tên nhà cung cấp đơn và `provider/search` chọn mặc định dịch vụ, không phải tên mô hình upstream. Kiểm tra quyền sở hữu lựa chọn tường minh/thành viên combo trước khi gửi. Antigravity dùng sandbox riêng, ID dự án/request/session thật, ánh xạ mô hình/suy nghĩ, Google Search và proxy nghiêm ngặt theo tài khoản. Loại `thought: true` khỏi câu trả lời và ngữ cảnh trích dẫn. Lỗi 404 mô hình Gemini cụ thể dùng một lần thử tài khoản; lỗi 404 tài nguyên Antigravity chính xác nhưng mơ hồ dùng tối đa **ba**, không ghi cooldown cho tài khoản khỏe. Thành công chỉ xóa phạm vi tìm kiếm tương ứng; fallback xác thực/quota khác giữ nguyên.

### Phụ thuộc, trình cài đặt và giao diện

Nâng React **19.3.0**, ESLint **10.12.0**, Vitest **5.0.3**/Vite **8.3.2** và Undici **8.11.2**. Giữ dispatcher Node 22, CONNECT, ghim DNS, hủy và chính sách proxy không chuyển sang kết nối trực tiếp khi lỗi; bỏ phụ thuộc không dùng. Trình cài đặt kiểm tra mức runtime tối thiểu chính xác và CLI vừa liên kết. Đóng gói Monaco **0.57.0** cùng worker cùng nguồn, sửa markdown/chuyển ngôn ngữ tài liệu và cảnh báo React mà không mất bản nháp hay an toàn hydration. Phạm vi ESM hẹp không đổi launcher CommonJS; giữ fallback SQLite tùy chọn.

### Xuất bản phiên bản

Workflow npm/Docker thủ công yêu cầu tag ổn định thật và commit chính xác; provenance npm cũng khớp ref/SHA dispatch. Tarball gốc được lưu trước xuất bản và phục hồi sau khi kiểm tra SHA512 của registry. Tuần tự hóa toàn cục và so sánh phiên bản số ngăn lần thử lại cũ thay thế `latest` mới hơn; thiếu artifact gốc thì dừng an toàn.

### Kiểm chứng, bảo mật và giới hạn nâng cấp

Kiểm chứng trước đó gồm test cô lập, lint không cảnh báo, build ứng dụng/CLI, xuất tài liệu, kiểm tra trình duyệt và nghiệm thu loopback/standalone với SQLite cho tìm kiếm/sử dụng. Kiểm chứng cuối tại máy cục bộ: **494 tệp test, 4.091 đạt, 100 bỏ qua, 1 todo, không có lỗi** với Node 22.23.2; lint không lỗi/cảnh báo, đóng gói CLI và kiểm tra Docker đều đạt. Không dùng tài khoản sản xuất, suy luận upstream thật, thử lại tăng chi phí hay triển khai tự động. Nghiên cứu danh mục **không chứng minh quyền truy cập tài khoản hoặc khả năng phục vụ thực tế**.

Vẫn xác minh TLS; ngoại lệ chứng chỉ tự ký chỉ theo request, không toàn cục. **Cảnh báo node-forge và braces vẫn còn**: không tuyên bố bản phát hành không có lỗ hổng. Sau khi xuất bản, cài `@joyccn/zenrouter@0.9.7` hoặc dùng image ghim `joyccn/zenrouter:0.9.7`. Quy trình container chỉ nhắm **linux/amd64**; lưu bền tại **/app/data** và sao lưu trước nâng cấp. Tài liệu không xác nhận đã xuất bản hoặc tag đã tồn tại.

---

[Bản phát hành GitHub](https://github.com/ZenRouter/ZenRouter/releases/tag/v0.9.7) · [Nhật ký đầy đủ](https://github.com/ZenRouter/ZenRouter/blob/master/CHANGELOG.md) · [Chi tiết kỹ thuật](https://github.com/ZenRouter/ZenRouter/blob/master/docs/CHANGELOG_v0.9.7.md) · [Ghi chú phát hành](https://github.com/ZenRouter/ZenRouter/blob/master/releases/RELEASE_NOTES_v0.9.7.md) · [Phiên bản trước 0.9.6 (lịch sử)](https://github.com/ZenRouter/ZenRouter/blob/master/releases/RELEASE_NOTES_v0.9.6.md)
