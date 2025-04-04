import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css'; // Reutilizamos los estilos del login

interface UserCreate {
    nombre_usuario: string;
    email: string;
    password: string;
    id_rol: string;
}

const Register = () => {
    const [nombre_usuario, setNombreUsuario] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    // ID de rol fijo para administrador
    const ID_ROL_ADMIN = "296d328a-c861-4340-aa2f-7dab64dcded1";

    // Función para hacer hash de la contraseña
    async function hashPassword(password: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        // Validaciones básicas
        if (!nombre_usuario || !email || !password || !confirmPassword) {
            setError('Por favor completa todos los campos.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        // Validación de formato de correo
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setError('Por favor ingresa un correo electrónico válido.');
            return;
        }

        try {
            setLoading(true);
            
            // Crear objeto de usuario para enviar
            const userData: UserCreate = {
                nombre_usuario,
                email,
                password: await hashPassword(password),
                id_rol: ID_ROL_ADMIN
            };

            // Realizar la petición de registro
            const response = await fetch('http://localhost:8000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error al registrar usuario');
            }

            // Si todo salió bien, redirigir al login
            navigate('/login', { state: { message: 'Registro exitoso. Por favor inicia sesión.' } });

        } catch (error: any) {
            console.error('Error al registrar:', error);
            setError(error.message || 'Error al registrar el usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="bg-image"></div>
            <div className="form-container">
                <form className="login-form" onSubmit={handleRegister}>
                    <h1 className="login-title">Bienvenido</h1>
                    <h2 className="login-subtitle">Regístrate</h2>

                    {error && <div className="error-message">{error}</div>}

                    <div className="input-group">
                        <label htmlFor="nombre_usuario" className="input-label">
                            Nombre de Usuario
                        </label>
                        <input
                            id="nombre_usuario"
                            type="text"
                            placeholder="Juan Pérez"
                            value={nombre_usuario}
                            onChange={(e) => setNombreUsuario(e.target.value)}
                            required
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email" className="input-label">
                            Correo Electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="usuario@epn.edu.ec"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password" className="input-label">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder=""
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword" className="input-label">
                            Confirmar Contraseña
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder=""
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="rol" className="input-label">
                            Rol
                        </label>
                        <select 
                            id="rol" 
                            className="input-field"
                            disabled
                        >
                            <option value={ID_ROL_ADMIN}>Administrador</option>
                        </select>
                        <small className="text-muted">Actualmente solo está disponible el rol de Administrador</small>
                    </div>

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : 'Registrarse'}
                    </button>
                    
                    <div className="register-link">
                        ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;