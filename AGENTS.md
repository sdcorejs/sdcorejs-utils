# Quy tắc phát triển package npm

Các quy tắc dưới đây áp dụng cho toàn bộ repository `@sdcorejs/utils`, đặc biệt là mọi API được xuất qua các entry point npm. Thay đổi có sẵn trong working tree phải được giữ nguyên.

## JSDoc là một phần của hợp đồng public

- Package npm phải có JSDoc cực kỳ chi tiết, đầy đủ và chính xác. Người dùng phải hiểu và sử dụng đúng API từ IDE hover và file `.d.ts` đã publish, không cần đọc implementation.
- Bao phủ mọi export: function, overload, class, constructor, method, utility-object member, interface/type, option, property, constant và alias. Một dòng mô tả tên hàm hoặc chỉ `@see` không đủ cho API có hành vi phức tạp.
- Viết JSDoc API bằng tiếng Anh theo style hiện có. Giữ nguyên UTF-8; không thay đổi hành vi để làm cho implementation khớp một mô tả tự suy đoán.
- Với function/method, mô tả mục đích và trường hợp sử dụng; `@param` cho từng tham số cùng đơn vị, giới hạn, mặc định; `@typeParam` khi cần giải thích generic; `@returns` với hình dạng và ý nghĩa của kết quả; `@throws` cho các lỗi có chủ đích và điều kiện phát sinh. Hàm async phải nêu giá trị resolve, nguyên nhân reject và cách xử lý hủy/timeout nếu có.
- Ghi rõ `null`, `undefined`, chuỗi/mảng rỗng, giá trị không hợp lệ, coercion, mutation/reference identity, thứ tự, duplicate, sparse array và giới hạn độ sâu khi có liên quan. Không che giấu hành vi legacy khác với tên gọi.
- Mô tả môi trường chạy, side effect, I/O, API trình duyệt, tài nguyên phải cleanup, nguồn thời gian/randomness, timezone/DST, encoding, precision và giới hạn bảo mật theo đúng implementation.
- Mỗi callable public phải có ít nhất một `@example` dùng được từ public entry point, thể hiện kết quả mong đợi. API phức tạp phải có thêm ví dụ boundary/error/async và lưu ý migration. Ví dụ không chứa secrets thật; input không tin cậy và generic type assertion không được mô tả như runtime validation.
- Option/property phải ghi ý nghĩa, giá trị mặc định, miền hợp lệ và tương tác với option khác. Constant phải nói rõ ý nghĩa, đơn vị/format và giới hạn sử dụng. Alias deprecated phải giữ `@deprecated`, API thay thế và khác biệt hành vi.
- JSDoc phải hiển thị khi hover qua `StringUtilities.method` và các object tương tự, không chỉ tại hàm private được object tham chiếu. Kiểm tra cả declaration của root và subpath sau build.
- Dùng code và tests làm bằng chứng. Sửa tài liệu cũ sai hoặc thiếu; không bổ sung mô tả hứa hẹn behavior chưa có. Comment implementation giải thích lý do và invariant khó hiểu, tránh diễn giải lại từng dòng code.

## Test coverage phải đầy đủ theo hành vi

- Mỗi API public và thay đổi hành vi phải có test chứng minh hợp đồng đã ghi trong JSDoc: happy path, boundary, invalid input, error/rejection, default/option interactions và compatibility. Không chỉ kiểm tra rằng hàm được gọi hoặc object tồn tại.
- Bao phủ các trường hợp liên quan: nullish/empty, Unicode, zero/negative/non-finite numbers, duplicate/sparse/cyclic data, prototype-sensitive keys/accessors, mutation, timezone/DST, cancellation/timeout/race, browser cleanup và môi trường thiếu capability.
- Mục tiêu cho logic mới hoặc được thay đổi là 100% các nhánh hành vi có thể kiểm chứng, cùng statements/functions/lines tương ứng. Đọc danh sách uncovered thực tế; mọi nhánh chưa kiểm chứng phải được báo rõ với lý do và rủi ro. Con số coverage tổng không thay thế việc chứng minh hợp đồng.
- Không hạ threshold, thu hẹp include, thêm ignore/exclude hoặc viết test lặp implementation chỉ để làm đẹp coverage. Nhánh không thể kiểm chứng trong môi trường hiện tại phải được giải thích; không tự tuyên bố coverage đầy đủ.
- Dùng dữ liệu và fake clock/randomness có kiểm soát. Test async phải chứng minh cleanup, propagation và kết thúc; không phụ thuộc mạng thật hay chờ timeout thật khi có thể mô phỏng.
- Với package npm, kiểm tra cả runtime và public type contract: ESM/CJS, root/subpath exports, overload/generic inference, declaration và môi trường browser/Node phù hợp. Các ví dụ mới trong JSDoc phải được kiểm tra type và kết quả; ví dụ phụ thuộc browser cần validation ở môi trường tương ứng.
- Chạy các script hiện có phù hợp với thay đổi: `npm run typecheck`, `npm run test:coverage`, `npm run build`, `npm run validate:package`, `npm run test:examples`. `npm run validate` tập hợp các kiểm tra package chính; chỉ chạy site validation khi thay đổi site.
- Thay đổi chỉ JSDoc phải được kiểm tra không đổi executable code/public type signatures, JSDoc còn trong `.d.ts`, ví dụ hợp lệ và diff sạch. Không thêm test vô nghĩa chỉ để xác nhận nội dung comment.
- Báo kết quả thật: số test, coverage theo metric và các khoảng trống quan trọng. Phân biệt test đã viết, test đã chạy và test bị bỏ qua. Không gọi công việc hoàn tất nếu kiểm tra liên quan thất bại hoặc chưa được giải thích.

## Ranh giới của utils

- Giữ package độc lập framework và không thêm runtime dependency khi chưa thuộc phạm vi yêu cầu.
- Không đưa model, endpoint, business rule hoặc cấu hình riêng của một ứng dụng vào utility tổng quát.
- Không tự commit, push, publish, đổi version hoặc sửa thay đổi không liên quan.

## Benchmark và release package

- Thay đổi ảnh hưởng hiệu năng, hot path hoặc tuyên bố tối ưu phải có benchmark tái lập được: baseline có ý nghĩa, assertion kết quả, kích thước dữ liệu đại diện, warmup, nhiều mẫu đo, p50/p95 và thông tin môi trường/source revision. Ghi nhận memory/allocation khi phù hợp và nêu giới hạn của phép đo.
- Chạy benchmark độc lập với build/test nặng; không dùng ngưỡng thời gian phụ thuộc máy trong unit test. Thay đổi chỉ kiểu TypeScript không sinh công việc runtime: ghi rõ benchmark runtime không áp dụng thay vì tạo số liệu giả. Benchmark query executor tại package sử dụng khi hành vi thực thi thay đổi.
- Model dùng chung phải có kiểm tra compiler dương/âm trên package đóng gói qua root/subpath và declaration ESM/CJS; runtime coverage không chứng minh được contract của kiểu bị xóa sau biên dịch.
- Release đã được người dùng yêu cầu dùng Changesets và workflow `.github/workflows/publish.yml` với npm trusted publishing. Tôn trọng version người dùng chỉ định, chạy kiểm tra liên quan trước khi publish và xác nhận version thực tế trên npm trước khi báo phát hành thành công.
- Chỉ stage file thuộc phạm vi công việc; không commit credential, fixture package tạm, node_modules, coverage report hoặc build output.
