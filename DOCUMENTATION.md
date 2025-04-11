# Tài liệu kỹ thuật Candy Crush Clone

## Cấu trúc code

### 1. Các hằng số và biến toàn cục

```javascript
const GRID_SIZE = 8;        // Kích thước bảng game (8x8)
const CANDY_SIZE = 60;      // Kích thước mỗi viên kẹo (pixel)
const CANDY_TYPES = 6;      // Số loại kẹo khác nhau
const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']; // Màu sắc các loại kẹo

let grid = [];              // Mảng 2 chiều lưu trữ trạng thái bảng game
let selectedCandy = null;   // Viên kẹo đang được chọn
let score = 0;              // Điểm số
```

### 2. Các hàm chính

#### initGrid()
- Mục đích: Khởi tạo bảng game với các viên kẹo ngẫu nhiên
- Logic:
  - Tạo mảng 2 chiều 8x8
  - Gán giá trị ngẫu nhiên từ 0-5 cho mỗi ô (tương ứng với 6 loại kẹo)

#### drawGrid()
- Mục đích: Vẽ bảng game lên canvas
- Logic:
  - Xóa canvas
  - Vẽ từng viên kẹo với màu sắc tương ứng
  - Vẽ viền cho mỗi viên kẹo
  - Highlight viên kẹo đang được chọn

#### checkMatches()
- Mục đích: Kiểm tra các hàng/ cột có 3 viên kẹo giống nhau trở lên
- Logic:
  - Kiểm tra theo hàng ngang
  - Kiểm tra theo hàng dọc
  - Trả về danh sách các vị trí kẹo cần xóa

#### removeMatches()
- Mục đích: Xóa các viên kẹo tạo thành hàng/ cột và cập nhật điểm
- Logic:
  - Gọi checkMatches() để tìm các viên kẹo cần xóa
  - Đánh dấu các vị trí cần xóa bằng giá trị -1
  - Cộng điểm (10 điểm/viên kẹo)

#### fillEmptySpaces()
- Mục đích: Lấp đầy các ô trống sau khi xóa kẹo
- Logic:
  - Duyệt từ dưới lên trên
  - Đếm số ô trống
  - Di chuyển các viên kẹo xuống
  - Tạo kẹo mới cho các ô trống phía trên

#### handleClick()
- Mục đích: Xử lý sự kiện click chuột
- Logic:
  - Tính toán vị trí click trên canvas
  - Nếu chưa chọn kẹo: lưu vị trí kẹo được chọn
  - Nếu đã chọn kẹo: kiểm tra và thực hiện hoán đổi
  - Kiểm tra kết quả sau khi hoán đổi
  - Nếu không tạo được hàng/ cột: hoán đổi lại
  - Nếu tạo được hàng/ cột: xóa kẹo và lấp đầy ô trống

## Luồng xử lý chính

1. Khởi tạo game:
   - Tạo canvas
   - Khởi tạo bảng game
   - Vẽ bảng game
   - Đăng ký sự kiện click

2. Khi người chơi click:
   - Chọn kẹo đầu tiên
   - Chọn kẹo thứ hai
   - Kiểm tra tính hợp lệ của nước đi
   - Hoán đổi kẹo
   - Kiểm tra kết quả
   - Xử lý kết quả (xóa kẹo, lấp đầy ô trống)
   - Vẽ lại bảng game

## Các điểm cần lưu ý

1. Kiểm tra tính hợp lệ của nước đi:
   - Hai viên kẹo phải nằm cạnh nhau
   - Hoán đổi phải tạo được ít nhất một hàng/ cột 3 viên kẹo

2. Xử lý chuỗi kết quả:
   - Sau khi xóa kẹo, kiểm tra lại xem có tạo thêm hàng/ cột mới không
   - Lặp lại cho đến khi không còn hàng/ cột nào có thể xóa

3. Hiệu suất:
   - Sử dụng mảng 2 chiều để lưu trữ trạng thái
   - Tối ưu việc vẽ lại canvas
   - Giảm thiểu số lần kiểm tra kết quả 