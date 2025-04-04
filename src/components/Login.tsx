import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate(); // Hook para la navegación

    // Verificar si ya hay un token al cargar el componente
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/'); // Redirigir si ya hay un token
        }
    }, [navigate]);

    // Función para hacer hash de la contraseña
    async function hashPassword(password: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent form from refreshing the page
        setError('');

        // Validar campos
        if (!email || !password) {
            setError('Por favor completa ambos campos.');
            return;
        }

        try {
            setLoading(true);

            console.log('email', email);
            // Hacer hash de la contraseña
            const hashedPassword = await hashPassword(password);

            // Configurar el cuerpo de la solicitud
            const body = new URLSearchParams();
            body.append('username', email);
            body.append('password', hashedPassword);

            // Realizar la petición de login
            const response = await fetch('http://localhost:8000/login', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                  },
                body: body,
            });
            console.log("response", response);

            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                throw new Error('Error en las credenciales');
            }

            // Procesar la respuesta
            const data = await response.json();

            // Guardar el token en localStorage
            localStorage.setItem('token', data.access_token);

            // Obtener y guardar información del usuario
            try {
                const userResponse = await fetch('http://localhost:8000/perfil', {
                    headers: {
                        'Authorization': `Bearer ${data.access_token}`
                    }
                });
                
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    // Guardar datos del usuario en localStorage para usar en la aplicación
                    localStorage.setItem('usuario', JSON.stringify({
                        nombre: userData.nombre || userData.username || email,
                        rol: userData.rol || 'Usuario',
                        imagen: userData.imagen || '/profile-placeholder.jpg'
                    }));
                }
            } catch (error) {
                console.error('Error al obtener datos del usuario:', error);
                // Si falla obtener datos del usuario, guardar datos básicos
                localStorage.setItem('usuario', JSON.stringify({
                    nombre: email,
                    rol: 'Usuario',
                    imagen: '/profile-placeholder.jpg'
                }));
            }

            // Redireccionar al usuario al dashboard
            navigate('/');

        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            setError('Usuario o contraseña incorrectos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="bg-image"></div>
            <div className="form-container">
                <form className="login-form" onSubmit={handleLogin}>
                    <h1 className="login-title">Bienvenido</h1>
                    <h2 className="login-subtitle">Inicia sesión</h2>

                    {error && <div className="error-message">{error}</div>}

                    <div className="input-group">
                        <label htmlFor="email" className="input-label">
                            Usuario
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
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : 'Ingresar'}
                    </button>
                    
                    <div className="register-link">
                        ¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;