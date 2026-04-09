CREATE TABLE IF NOT EXISTS users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('TEACHER', 'STUDENT') NOT NULL,
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_verifications (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(150) NOT NULL,
  otp_code    VARCHAR(10) NOT NULL,
  expires_at  DATETIME NOT NULL,
  is_used     BOOLEAN DEFAULT FALSE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  class_code  VARCHAR(20) NOT NULL UNIQUE,
  password    VARCHAR(20) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  subject     VARCHAR(100),
  grade_level VARCHAR(50),
  class_focus TEXT,
  teacher_id  BIGINT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS class_enrollments (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  class_id    BIGINT NOT NULL,
  student_id  BIGINT NOT NULL,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (class_id, student_id),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignments (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  class_id    BIGINT NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  deadline    DATE NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submissions (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  assignment_id BIGINT NOT NULL,
  student_id    BIGINT NOT NULL,
  file_name     VARCHAR(255) NOT NULL,
  file_path     VARCHAR(500) NOT NULL,
  file_size_kb  DECIMAL(10,2),
  submitted_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (assignment_id, student_id),
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grades (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  submission_id BIGINT NOT NULL UNIQUE,
  graded_by     BIGINT NOT NULL,
  grade         VARCHAR(50),
  feedback      TEXT,
  graded_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS peer_reviews (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  assignment_id BIGINT NOT NULL,
  reviewer_id   BIGINT NOT NULL,
  submission_id BIGINT NOT NULL,
  grade         VARCHAR(50),
  feedback      TEXT,
  reviewed_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (reviewer_id, submission_id),
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);
