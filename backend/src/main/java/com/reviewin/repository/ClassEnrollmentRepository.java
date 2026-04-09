package com.reviewin.repository;

import com.reviewin.model.ClassEnrollment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassEnrollmentRepository extends JpaRepository<ClassEnrollment, Long> {

    boolean existsByClassroomIdAndStudentId(Long classId, Long studentId);

    long countByClassroomId(Long classId);

    long countByStudentId(Long studentId);

    List<ClassEnrollment> findAllByClassroomId(Long classId);

    List<ClassEnrollment> findAllByStudentId(Long studentId);

    Optional<ClassEnrollment> findByClassroomIdAndStudentId(Long classId, Long studentId);

    void deleteByClassroomIdAndStudentId(Long classId, Long studentId);
}
