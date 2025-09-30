'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  TextField
} from '@mui/material';
import { collection, getDocs, query } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
import { setUserRole } from '@/lib/roleService';
import { UserRole } from '@/types/roles';

interface UserData {
  id: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  lastLogin?: string;
}

const RoleManager: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar usuarios
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const usersCollection = collection(firestore, 'users');
        const usersQuery = query(usersCollection);
        const querySnapshot = await getDocs(usersQuery);
        
        const usersData: UserData[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          usersData.push({
            id: doc.id,
            email: userData.email || null,
            displayName: userData.displayName || null,
            role: userData.role || UserRole.PARTICIPANT,
            lastLogin: userData.lastLogin
          });
        });
        
        setUsers(usersData);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        setError('Error al cargar la lista de usuarios');
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);

  // Cambiar rol de usuario
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await setUserRole(userId, newRole);
      
      // Actualizar la lista de usuarios
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      setSuccess(`Rol actualizado correctamente`);
    } catch (err) {
      console.error('Error al cambiar rol:', err);
      setError('Error al cambiar el rol del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios por término de búsqueda
  const filteredUsers = users.filter(user =>
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: theme => theme.spacing(2) }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: theme => theme.spacing(2) }}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ mb: theme => theme.spacing(3) }}>
        <TextField
          label="Buscar usuario"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por email o nombre"
        />
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol Actual</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.displayName || 'Sin nombre'}</TableCell>
                  <TableCell>{user.email || 'Sin email'}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <FormControl fullWidth>
                      <InputLabel id={`role-label-${user.id}`}>Rol</InputLabel>
                      <Select
                        labelId={`role-label-${user.id}`}
                        value={user.role}
                        label="Rol"
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      >
                        <MenuItem value={UserRole.MODERATOR}>Moderador</MenuItem>
                        <MenuItem value={UserRole.PARTICIPANT}>Participante</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default RoleManager;