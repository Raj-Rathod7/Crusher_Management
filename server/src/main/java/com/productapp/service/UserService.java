package com.productapp.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.productapp.dto.UserResponse;
import com.productapp.entity.Role;
import com.productapp.entity.User;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.RoleRepository;
import com.productapp.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
        private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                                           RoleRepository roleRepository,
                                           PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
                this.passwordEncoder = passwordEncoder;
    }

        @Transactional
        public UserResponse save(User user) {

        Role role = roleRepository.findById(
                        user.getRole().getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found"));

        user.setRole(role);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return UserResponse.fromEntity(userRepository.save(user));
    }

    public List<UserResponse> getAll() {
        return userRepository.findAllByIsActiveTrue().stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

        public Page<UserResponse> getPage(Pageable pageable) {
                return userRepository.findAllByIsActiveTrue(pageable).map(UserResponse::fromEntity);
        }

    public UserResponse getById(Long id) {
        User user = userRepository.findById(id)
                .filter(foundUser -> Boolean.TRUE.equals(foundUser.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id : " + id));
        return UserResponse.fromEntity(user);
    }

        @Transactional
        public UserResponse update(Long id, User user) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id : " + id));

        existing.setUsername(user.getUsername());
                if (user.getPassword() != null && !user.getPassword().isBlank()) {
                        existing.setPassword(passwordEncoder.encode(user.getPassword()));
                }
                if (user.getIsActive() != null) {
                        existing.setIsActive(user.getIsActive());
                }

        Role role = roleRepository.findById(
                        user.getRole().getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found"));

        existing.setRole(role);

        return UserResponse.fromEntity(userRepository.save(existing));
    }

        @Transactional
        public void delete(Long id) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id : " + id));
        
                existing.setIsActive(false);
                userRepository.save(existing);
    }
}