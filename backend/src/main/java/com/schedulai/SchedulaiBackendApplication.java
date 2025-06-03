package com.schedulai;

import com.schedulai.domain.Student;
import com.schedulai.domain.User;
import com.schedulai.domain.UserRole;
import com.schedulai.repository.StudentRepository;
import com.schedulai.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDate;
import java.util.List;

@SpringBootApplication
public class SchedulaiBackendApplication {
	
	private static final Logger log = LoggerFactory.getLogger(SchedulaiBackendApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(SchedulaiBackendApplication.class, args);
	}
	
	/**
	 * 系统启动时数据修复工具
	 * 为已有的用户记录添加studentId关联
	 */
	@Bean
	public CommandLineRunner initUserStudentRelations(UserRepository userRepository, StudentRepository studentRepository) {
		return args -> {
			log.info("开始检查并修复用户-学生关联...");
			
			try {
				// 获取所有学生角色的用户
				List<User> studentUsers = userRepository.findByRole(UserRole.STUDENT);
				log.info("系统中共有 {} 个学生用户需要检查", studentUsers.size());
				
				// 同时加载所有学生记录，用于后续对比
				List<Student> allStudents = studentRepository.findAll();
				log.info("系统中共有 {} 个学生记录", allStudents.size());
				
				int updatedCount = 0;
				int existingCount = 0;
				int problemCount = 0;
				
				for (User user : studentUsers) {
					try {
						// 跳过已经有studentId的用户
						if (user.getStudentId() != null) {
							log.debug("用户 {} (ID: {}) 已有关联的学生ID: {}, 跳过", 
									user.getUsername(), user.getId(), user.getStudentId());
							existingCount++;
							continue;
						}
						
						// 尝试通过姓名查找对应的学生记录
						List<Student> matchingStudents = studentRepository.findByName(user.getName());
						
						if (!matchingStudents.isEmpty()) {
							// 关联第一个匹配的学生记录
							Student student = matchingStudents.get(0);
							log.info("为用户 {} (ID: {}) 找到匹配的学生记录: {} (ID: {})", 
									user.getUsername(), user.getId(), student.getName(), student.getId());
							
							user.setStudentId(student.getId());
							userRepository.save(user);
							
							updatedCount++;
							log.info("已为用户 {} (ID: {}) 关联学生ID: {}", 
									user.getUsername(), user.getId(), student.getId());
						} else {
							// 如果找不到匹配的学生记录，则创建一个新的
							log.warn("找不到与用户 {} (ID: {}) 匹配的学生记录，将创建新记录", 
									user.getUsername(), user.getId());
							
							Student newStudent = new Student();
							newStudent.setName(user.getName());
							newStudent.setGrade(user.getGrade());
							newStudent.setPhone(user.getPhone());
							newStudent.setParent(user.getParentName());
							newStudent.setParentPhone(user.getParentPhone());
							
							// 设置默认值
							newStudent.setEnrollmentDate(LocalDate.now());
							newStudent.setStatus("active");
							
							Student savedStudent = studentRepository.save(newStudent);
							log.info("已为用户 {} 创建新的学生记录，ID: {}", user.getUsername(), savedStudent.getId());
							
							// 更新用户的studentId字段
							user.setStudentId(savedStudent.getId());
							userRepository.save(user);
							
							updatedCount++;
							log.info("已为用户 {} (ID: {}) 关联新创建的学生ID: {}", 
									user.getUsername(), user.getId(), savedStudent.getId());
						}
					} catch (Exception e) {
						log.error("处理用户 {} (ID: {}) 时发生错误: {}", 
								user.getUsername(), user.getId(), e.getMessage(), e);
						problemCount++;
					}
				}
				
				log.info("用户-学生关联修复完成:");
				log.info("- 已有关联: {} 个", existingCount);
				log.info("- 已更新关联: {} 个", updatedCount);
				log.info("- 处理失败: {} 个", problemCount);
			} catch (Exception e) {
				log.error("用户-学生关联修复过程中发生错误: {}", e.getMessage(), e);
			}
		};
	}
} 