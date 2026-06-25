package com.productapp.service;

import java.util.List;

import org.springframework.stereotype.Service;

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

    public User save(User user) {

        Role role = roleRepository.findById(
                        user.getRole().getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found"));

        user.setRole(role);

        return userRepository.save(user);
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public User getById(Long id) {

        return userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id : " + id));
    }

    public User update(Long id, User user) {

        User existing = getById(id);

        existing.setUsername(user.getUsername());
        existing.setPassword(user.getPassword());
        existing.setIsActive(user.getIsActive());

        Role role = roleRepository.findById(
                        user.getRole().getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found"));

        existing.setRole(role);

        return userRepository.save(existing);
    }

    public void delete(Long id) {

        User existing = getById(id);

        userRepository.delete(existing);
    }
}