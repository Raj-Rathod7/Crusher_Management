package com.productapp.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

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

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository) {

        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    public UserResponse save(User user) {

        Role role = roleRepository.findById(
                        user.getRole().getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found"));

        user.setRole(role);

        return UserResponse.fromEntity(userRepository.save(user));
    }

    public List<UserResponse> getAll() {
        return userRepository.findAll().stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public UserResponse getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id : " + id));
        return UserResponse.fromEntity(user);
    }

    public UserResponse update(Long id, User user) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id : " + id));

        existing.setUsername(user.getUsername());
        existing.setPassword(user.getPassword());
        existing.setIsActive(user.getIsActive());

        Role role = roleRepository.findById(
                        user.getRole().getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found"));

        existing.setRole(role);

        return UserResponse.fromEntity(userRepository.save(existing));
    }

    public void delete(Long id) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id : " + id));
        userRepository.delete(existing);
    }
}