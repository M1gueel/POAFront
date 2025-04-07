import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/userAPI';
import '../styles/Login.css';

const Login = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const { login } = useAuth();

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        // Validar campos
        if (!email || !password) {
            setError('Por favor completa ambos campos.');
            return;
        }

        try {
            setLoading(true);

            // Usar el servicio de autenticación
            const { token, userData } = await authAPI.login(email, password);

            // Usar la función login del contexto
            login(token, userData);

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