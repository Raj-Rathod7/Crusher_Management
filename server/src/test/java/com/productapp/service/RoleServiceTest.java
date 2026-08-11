package com.productapp.service;

import com.productapp.entity.Role;
import com.productapp.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private RoleService roleService;

    @Test
    void getByIdShouldReturnRoleResponse() {
        Role role = new Role();
        role.setId(1L);
        role.setRoleName("ADMIN");
        role.setDescription("Administrator");
        role.setIsActive(true);

        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));

        var response = roleService.getById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("ADMIN", response.getRoleName());
        assertEquals("Administrator", response.getDescription());
    }
}
