import React, { useState } from 'react';
import { Form, Button, Container, Card } from 'react-bootstrap';

// Interface definition for Usuario
export interface UsuarioFormProps {
  id_usuario: string;
  id_rol: string;
}

const RegistrarUsuario: React.FC = () => {
    const [nombre_usuario, setNombre_usuario] = useState('');
    const [email, setEmail] = useState('');
    const [password_hash, setPassword_hash] = useState('');
    const [id_rol, setId_rol] = useState('');
    const [activo, setActivo] = useState(true);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        // Aquí puedes manejar el envío del formulario
        console.log({
            nombre_usuario,
            email,
            password_hash,
            id_rol,
            activo,
        });
    };

    return (
        <Container className="d-flex justify-content-center align-items-start py-5" style={{ minHeight: '100vh' }}>
            <Card className="p-5 shadow-lg" style={{ width: '80%', maxWidth: '900px' }}>
                <div className="text-center mb-4 bg-primary bg-gradient text-white p-3 rounded-3 shadow-sm">
                    <h2 className="mb-0 fw-bold">Registrar Nuevo Usuario</h2>
                </div>
                <Form className="py-3" onSubmit={handleSubmit}>
                    <Form.Group controlId="nombre_usuario" className="mb-4">
                        <Form.Label className="fw-semibold">Nombre de Usuario</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Ingrese el nombre de usuario"
                            size="lg"
                            value={nombre_usuario}
                            onChange={(e) => setNombre_usuario(e.target.value)}
                        />
                    </Form.Group>
                    
                    <Form.Group controlId="email" className="mb-4">
                        <Form.Label className="fw-semibold">Email</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Ingrese el email"
                            size="lg"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group controlId="password_hash" className="mb-4">
                        <Form.Label className="fw-semibold">Contraseña</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Ingrese la contraseña"
                            size="lg"
                            value={password_hash}
                            onChange={(e) => setPassword_hash(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group controlId="id_rol" className="mb-4">
                        <Form.Label className="fw-semibold">Rol</Form.Label>
                        <Form.Control
                            as="select"
                            size="lg"
                            value={id_rol}
                            onChange={(e) => setId_rol(e.target.value)}
                        >
                            <option>Seleccione...</option>
                        </Form.Control>
                    </Form.Group>

                    <Form.Group controlId="activo" className="mb-4">
                        <Form.Check
                            type="checkbox"
                            label="Activo"
                            checked={activo}
                            onChange={(e) => setActivo(e.target.checked)}
                        />
                    </Form.Group>

                    <div className="text-center mt-5 d-flex justify-content-center gap-4">
                        <Button variant="secondary" type="button" size="lg" className="px-4 py-2">
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" size="lg" className="px-4 py-2">
                            Registrar Usuario
                        </Button>
                    </div>
                </Form>
            </Card>
        </Container>
    );
};

export default RegistrarUsuario;