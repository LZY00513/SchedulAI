package com.schedulai.service;

import com.schedulai.domain.Student;
import com.schedulai.domain.User;
import com.schedulai.domain.UserRole;
import com.schedulai.dto.AuthResponseDTO;
import com.schedulai.dto.LoginRequestDTO;
import com.schedulai.dto.RegisterRequestDTO;
import com.schedulai.dto.UserDTO;
import com.schedulai.repository.StudentRepository;
import com.schedulai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final StudentRepository studentRepository;
    
    // 使用构造函数注入，添加@Lazy避免循环依赖
    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Lazy AuthenticationManager authenticationManager,
            UserService userService,
            StudentRepository studentRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.studentRepository = studentRepository;
    }
    
    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO registerRequest) {
        log.info("开始处理注册请求: username={}, role={}, name={}, email={}", 
                registerRequest.getUsername(), 
                registerRequest.getRole(),
                registerRequest.getName(),
                registerRequest.getEmail());
        
        // 详细记录请求内容
        log.debug("完整注册请求数据: {}", registerRequest);
        
        // 检查参数完整性
        if (registerRequest.getUsername() == null || registerRequest.getUsername().isEmpty()) {
            log.error("注册失败: 用户名为空");
            throw new IllegalArgumentException("用户名不能为空");
        }
        
        if (registerRequest.getPassword() == null || registerRequest.getPassword().isEmpty()) {
            log.error("注册失败: 密码为空");
            throw new IllegalArgumentException("密码不能为空");
        }
        
        if (registerRequest.getName() == null || registerRequest.getName().isEmpty()) {
            log.error("注册失败: 姓名为空");
            throw new IllegalArgumentException("姓名不能为空");
        }
        
        if (registerRequest.getEmail() == null || registerRequest.getEmail().isEmpty()) {
            log.error("注册失败: 邮箱为空");
            throw new IllegalArgumentException("邮箱不能为空");
        }
        
        // 规范化角色值 - 确保是STUDENT
        if (registerRequest.getRole() == null) {
            log.info("注册请求未指定角色，默认设置为STUDENT");
            registerRequest.setRole(UserRole.STUDENT);
        }
        
        try {
            // 创建新用户
            User user = User.builder()
                    .username(registerRequest.getUsername())
                    .password(passwordEncoder.encode(registerRequest.getPassword()))
                    .name(registerRequest.getName())
                    .email(registerRequest.getEmail())
                    .phone(registerRequest.getPhone())
                    .role(registerRequest.getRole())
                    .enabled(true)
                    .build();
            
            // 如果是学生用户，设置学生特有字段
            if (registerRequest.getRole() == UserRole.STUDENT) {
                log.info("设置学生特有字段: grade={}, parentName={}, parentPhone={}, address={}", 
                        registerRequest.getGrade(), 
                        registerRequest.getParentName(), 
                        registerRequest.getParentPhone(),
                        registerRequest.getAddress());
                
                user.setGrade(registerRequest.getGrade());
                user.setEnrollmentDate(registerRequest.getEnrollmentDate());
                user.setParentName(registerRequest.getParentName());
                user.setParentPhone(registerRequest.getParentPhone());
                user.setAddress(registerRequest.getAddress());
                user.setNotes(registerRequest.getNotes());
            }
            
            // 保存用户前进行最后的检查
            log.debug("准备保存用户: {}", user);
            
            // 保存用户到数据库
            User savedUser = userRepository.save(user);
            log.info("用户注册成功: id={}, username={}, role={}", savedUser.getId(), savedUser.getUsername(), savedUser.getRole());
            
            // 确认用户已成功保存
            User verifiedUser = userRepository.findById(savedUser.getId())
                    .orElseThrow(() -> new RuntimeException("保存用户后无法验证用户数据"));
            
            log.info("验证用户保存成功: id={}, 字段验证: username={}, role={}, 特有字段存在: {}",
                    verifiedUser.getId(),
                    verifiedUser.getUsername(),
                    verifiedUser.getRole(),
                    verifiedUser.getRole() == UserRole.STUDENT ? "是" : "否");
            
            // 如果是学生用户，同时创建Student表记录
            if (verifiedUser.getRole() == UserRole.STUDENT) {
                log.info("为用户 {} 创建对应的Student记录", verifiedUser.getUsername());
                
                try {
                    // 创建学生记录
                    Student student = new Student();
                    student.setName(verifiedUser.getName());
                    student.setGrade(verifiedUser.getGrade());
                    student.setPhone(verifiedUser.getPhone());
                    student.setParent(verifiedUser.getParentName());
                    student.setParentPhone(verifiedUser.getParentPhone());
                    
                    // 处理enrollmentDate
                    LocalDate enrollmentDate = null;
                    if (verifiedUser.getEnrollmentDate() != null && !verifiedUser.getEnrollmentDate().isEmpty()) {
                        try {
                            enrollmentDate = LocalDate.parse(verifiedUser.getEnrollmentDate());
                        } catch (Exception e) {
                            log.warn("无法解析注册日期: {}, 使用当前日期", verifiedUser.getEnrollmentDate());
                            enrollmentDate = LocalDate.now();
                        }
                    } else {
                        enrollmentDate = LocalDate.now();
                    }
                    student.setEnrollmentDate(enrollmentDate);
                    
                    // 设置默认状态为active
                    student.setStatus("active");
                    
                    // 保存Student记录
                    Student savedStudent = studentRepository.save(student);
                    log.info("成功创建Student记录，ID: {}", savedStudent.getId());
                    
                    // 将student ID保存到user记录中
                    verifiedUser.setStudentId(savedStudent.getId());
                    userRepository.save(verifiedUser);
                    log.info("已将学生ID: {} 关联到用户记录", savedStudent.getId());
                } catch (Exception e) {
                    log.error("创建Student记录失败", e);
                    // 不中断当前流程，用户记录依然有效
                }
            }
            
            // 返回用户信息
            UserDTO userDTO = mapToDTO(savedUser);
            log.debug("返回的用户DTO: {}", userDTO);
            
            return AuthResponseDTO.builder()
                    .user(userDTO)
                    .success(true)
                    .build();
        } catch (Exception e) {
            log.error("注册过程中发生异常: ", e);
            throw new RuntimeException("注册失败: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public AuthResponseDTO login(LoginRequestDTO loginRequest) {
        try {
            log.info("尝试登录: 用户名={}, 角色={}", loginRequest.getUsername(), loginRequest.getRole());
            
            // 首先查找用户
            User user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("用户名不存在"));
            
            log.info("找到用户: id={}, role={}, enabled={}", user.getId(), user.getRole(), user.isEnabled());
            
            // 检查用户是否启用
            if (!user.isEnabled()) {
                log.warn("用户已被禁用: {}", loginRequest.getUsername());
                throw new IllegalArgumentException("用户已被禁用，请联系管理员");
            }
            
            // 检查用户角色是否匹配 - 使用equals而不是!=来比较
            if (loginRequest.getRole() != null && !loginRequest.getRole().equals(user.getRole())) {
                log.warn("用户角色不匹配: 请求角色={}, 实际角色={}", loginRequest.getRole(), user.getRole());
                throw new IllegalArgumentException("用户角色不匹配，请使用正确的登录入口");
            }
            
            try {
                // 验证密码
                log.debug("开始验证密码");
                // 创建新的验证令牌
                UsernamePasswordAuthenticationToken authToken = 
                    new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                    );
                
                // 限制重试次数
                int maxRetries = 1;
                Authentication authentication = null;
                Exception lastException = null;
                
                for (int i = 0; i <= maxRetries; i++) {
                    try {
                        log.debug("尝试验证密码，次数: {}", i+1);
                        authentication = authenticationManager.authenticate(authToken);
                        break; // 验证成功，跳出循环
                    } catch (Exception e) {
                        lastException = e;
                        log.warn("密码验证失败 (尝试 {}): {}", i+1, e.getMessage());
                        if (i == maxRetries) {
                            throw e; // 达到最大重试次数，抛出异常
                        }
                    }
                }
                
                if (authentication != null) {
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    
                    // 更新最后登录时间
                    userService.updateLastLogin(user.getUsername());
                    
                    log.info("登录成功: 用户名={}, 角色={}", user.getUsername(), user.getRole());
                    
                    // 返回用户信息
                    return AuthResponseDTO.builder()
                            .user(mapToDTO(user))
                            .success(true)
                            .build();
                } else {
                    throw new IllegalArgumentException("用户名或密码不正确");
                }
            } catch (Exception e) {
                log.error("密码验证失败: {}", e.getMessage());
                throw new IllegalArgumentException("用户名或密码不正确");
            }
        } catch (IllegalArgumentException e) {
            log.error("登录业务逻辑错误: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("登录过程中发生未预期错误: ", e);
            throw new RuntimeException("登录过程发生错误: " + e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public boolean checkUsernameExists(String username) {
        return userRepository.existsByUsername(username);
    }
    
    @Transactional(readOnly = true)
    public boolean checkEmailExists(String email) {
        return userRepository.existsByEmail(email);
    }
    
    @Transactional(readOnly = true)
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + username));
    }
    
    @Transactional
    public void updatePassword(String username, String newPassword) {
        log.info("更新用户 {} 的密码", username);
        User user = getUserByUsername(username);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("用户 {} 的密码已更新", username);
    }
    
    @Transactional(readOnly = true)
    public boolean validateCredentials(String username, String password) {
        log.info("验证用户 {} 的密码", username);
        User user = getUserByUsername(username);
        
        // 创建验证令牌
        UsernamePasswordAuthenticationToken authToken = 
            new UsernamePasswordAuthenticationToken(username, password);
        
        try {
            // 使用AuthenticationManager验证密码
            authenticationManager.authenticate(authToken);
            log.info("用户 {} 的密码验证成功", username);
            return true;
        } catch (Exception e) {
            log.warn("用户 {} 的密码验证失败: {}", username, e.getMessage());
            throw new IllegalArgumentException("密码不正确");
        }
    }
    
    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .grade(user.getGrade())
                .enrollmentDate(user.getEnrollmentDate())
                .parentName(user.getParentName())
                .parentPhone(user.getParentPhone())
                .address(user.getAddress())
                .notes(user.getNotes())
                .studentId(user.getStudentId())
                .build();
    }
} 