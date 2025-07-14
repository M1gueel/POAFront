import React from 'react';
import { Nav, Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SidebarContentProps } from '../interfaces/bar';
import { TableProperties, FolderKanban, FileChartLine, CircleUserRound, UserPlus, LogOut, Icon } from 'lucide-react';
import { owl } from '@lucide/lab';
import { ROLES } from '../interfaces/user';

const SidebarContent: React.FC<SidebarContentProps> = ({
  usuario,
  onItemClick,
  isSidebarCollapsed,
  toggleSidebar
}) => {
  const { logout, hasAnyRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Función para determinar si un link está activo
  const isActive = (path: string) => {
    return location.pathname === path ? "active" : "";
  };

  // Función para manejar la navegación
  const handleNavigate = (path: string) => {
    navigate(path);
    if (onItemClick) onItemClick();
  };

  // Tamaño estándar para los iconos
  const iconSize = 18;

  // Función para verificar si el usuario tiene acceso a una ruta
  const hasAccessTo = (requiredRoles: string[]) => {
    return hasAnyRole(requiredRoles);
  };

  return (
    <React.Fragment>
      {/* Encabezado - Ajustado para mostrar/ocultar "SGP" basado en el estado colapsado */}
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
        <div
          className="fs-4 fw-semibold text-decoration-none text-white d-flex align-items-center"
          onClick={() => handleNavigate("/dashboard")}
          style={{ cursor: 'pointer' }}
        >
          <Icon iconNode={owl} size={24} className="me-2" />
          {!isSidebarCollapsed && "SGP"}
        </div>
      </div>

      {/* Botón de toggle separado en su propia fila */}
      <div className="d-flex justify-content-center p-2 border-bottom">
        <Button
          variant="outline-light"
          size="sm"
          onClick={toggleSidebar}
          className="d-none d-lg-block"
          style={{ width: isSidebarCollapsed ? '40px' : 'auto' }}
        >
          <TableProperties size={iconSize} />
          {!isSidebarCollapsed && <span className="ms-2">Contraer</span>}
        </Button>
      </div>

      {/* Solo mostrar estos elementos si el sidebar no está colapsado */}
      {!isSidebarCollapsed && (
        <>
          {/* Links de navegación */}
          <Nav className="flex-column mt-3">

            <div className="px-3 mb-2 text-secondary text-uppercase small">Inicio</div>

            {/* Ver Proyectos - Solo para ADMINISTRADOR y DIRECTOR_REFORMAS */}
            {hasAccessTo([ROLES.ADMINISTRADOR, ROLES.DIRECTOR_DE_REFORMAS]) && (
              <Nav.Item>
                <Nav.Link
                  className={`text-white ${isActive("/ver-proyectos")}`}
                  onClick={() => handleNavigate("/ver-proyectos")}
                >
                  <FolderKanban size={iconSize} className="me-2" />
                  Ver Proyectos
                </Nav.Link>
              </Nav.Item>
            )}

            <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">Proyectos Y Actividades</div>

            {/* Nuevo Proyecto - Solo para ADMINISTRADOR y DIRECTOR_INVESTIGACION */}
            {hasAccessTo([ROLES.ADMINISTRADOR, ROLES.DIRECTOR_DE_INVESTIGACION]) && (
              <Nav.Item>
                <Nav.Link
                  className={`text-white ${isActive("/tipos-proyecto")}`}
                  onClick={() => handleNavigate("/tipos-proyecto")}
                >
                  <FolderKanban size={iconSize} className="me-2" />
                  Nuevo Proyecto
                </Nav.Link>
              </Nav.Item>
            )}

            {/* Sección POAs - Solo mostrar si tiene acceso a alguna funcionalidad de POA */}
            {hasAccessTo([ROLES.ADMINISTRADOR, ROLES.DIRECTOR_DE_INVESTIGACION]) && (
              <>
                {/* <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">POAs</div> */}

                <Nav.Item>
                  <Nav.Link
                    className={`text-white ${isActive("/crear-poa")}`}
                    onClick={() => handleNavigate("/crear-poa")}
                  >
                    <FileChartLine size={iconSize} className="me-2" />
                    Nuevo POA
                  </Nav.Link>
                </Nav.Item>
              </>
            )}

            {/* Sección ACTIVIDADES - Solo mostrar si tiene acceso */}
            {hasAccessTo([ROLES.ADMINISTRADOR, ROLES.DIRECTOR_DE_INVESTIGACION, ROLES.DIRECTOR_DE_PROYECTO]) && (
              <>
                {/* <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">ACTIVIDADES</div> */}

                <Nav.Item>
                  <Nav.Link
                    className={`text-white ${isActive("/agregar-actividad-tarea")}`}
                    onClick={() => handleNavigate("/agregar-actividad-tarea")}
                  >
                    <FileChartLine size={iconSize} className="me-2" />
                    Agregar Actividades y Tareas
                  </Nav.Link>
                </Nav.Item>
              </>
            )}


            <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">Editar Proyectos Y Actividades</div>

            {/* Nuevo Proyecto - Solo para ADMINISTRADOR y DIRECTOR_INVESTIGACION */}
            {hasAccessTo([
              ROLES.ADMINISTRADOR, 
              ROLES.DIRECTOR_DE_INVESTIGACION
            ]) && (
              <Nav.Item>
                <Nav.Link
                  className={`text-white ${isActive("/editar-proyecto")}`}
                  onClick={() => handleNavigate("/editar-proyecto")}
                >
                  <FolderKanban size={iconSize} className="me-2" />
                  Editar Proyecto
                </Nav.Link>
              </Nav.Item>
            )}

            {/* Sección POAs - Solo mostrar si tiene acceso a alguna funcionalidad de POA */}
            {hasAccessTo([
              ROLES.ADMINISTRADOR,
              ROLES.DIRECTOR_DE_INVESTIGACION
            ]) && (
              <>
                {/* <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">POAs</div> */}

                <Nav.Item>
                  <Nav.Link
                    className={`text-white ${isActive("/editar-poa")}`}
                    onClick={() => handleNavigate("/editar-poa")}
                  >
                    <FileChartLine size={iconSize} className="me-2" />
                    Editar POA
                  </Nav.Link>
                </Nav.Item>
              </>
            )}

            {/* Sección ACTIVIDADES - Solo mostrar si tiene acceso */}
            {hasAccessTo([
              ROLES.ADMINISTRADOR,
              ROLES.DIRECTOR_DE_INVESTIGACION,
              ROLES.DIRECTOR_DE_PROYECTO
            ]) && (
              <>
                {/* <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">ACTIVIDADES</div> */}

                <Nav.Item>
                  <Nav.Link
                    className={`text-white ${isActive("/editar-actividad-tarea")}`}
                    onClick={() => handleNavigate("/editar-actividad-tarea")}
                  >
                    <FileChartLine size={iconSize} className="me-2" />
                    Editar Actividades y Tareas
                  </Nav.Link>
                </Nav.Item>
              </>
            )}


            {/* Sección Excel - Solo mostrar si tiene acceso a alguna funcionalidad */}
            {(hasAccessTo([ROLES.ADMINISTRADOR]) || hasAccessTo([ROLES.DIRECTOR_DE_INVESTIGACION]) || hasAccessTo([ROLES.DIRECTOR_DE_REFORMAS])) && (
              <>
                <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">
                  Excel
                </div>
                
                {/* Subir POA desde Excel - ADMINISTRADOR y DIRECTOR_REFORMAS */}
                {hasAccessTo([
                  ROLES.ADMINISTRADOR,
                  ROLES.DIRECTOR_DE_REFORMAS,
                ]) && (
                  <Nav.Item>
                    <Nav.Link
                      className={`text-white ${isActive("/subir-excel")}`}
                      onClick={() => handleNavigate("/subir-excel")}
                    >
                      <FileChartLine size={iconSize} className="me-2" />
                      Subir POA desde Excel
                    </Nav.Link>
                  </Nav.Item>
                )}

                {/* Reporte Anual - ADMINISTRADOR y DIRECTOR_REFORMAS */}
                {hasAccessTo([
                  ROLES.ADMINISTRADOR,
                  ROLES.DIRECTOR_DE_REFORMAS,
                ]) && (
                  <Nav.Item>
                    <Nav.Link
                      className={`text-white ${isActive("/reporte-poa")}`}
                      onClick={() => handleNavigate("/reporte-poa")}
                    >
                      <FileChartLine size={iconSize} className="me-2" />
                      Reporte Anual
                    </Nav.Link>
                  </Nav.Item>
                )}

                {/* Control de cambios - ADMINISTRADOR y DIRECTOR_REFORMAS */}
                {hasAccessTo([
                  ROLES.ADMINISTRADOR,
                  ROLES.DIRECTOR_DE_REFORMAS]) && (
                  <Nav.Item>
                    <Nav.Link
                      className={`text-white ${isActive("/LogsCargaExcel")}`}
                      onClick={() => handleNavigate("/LogsCargaExcel")}
                    >
                      <FileChartLine size={iconSize} className="me-2" />
                      Control de cambios - Subir POA
                    </Nav.Link>
                  </Nav.Item>
                )}
              </>
            )}

            {/* Información del usuario en la parte inferior del sidebar */}

             {/* Preferencias de usuario - Siempre visible */}
            <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">Usuario</div>
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/perfil")}`}
                onClick={() => handleNavigate("/perfil")}
              >
                <CircleUserRound size={iconSize} className="me-2" />
                Perfil
              </Nav.Link>
            </Nav.Item>

            {/* Registro de usuarios - Solo para ADMINISTRADOR */}
            {hasAccessTo([ROLES.ADMINISTRADOR]) && (
              <Nav.Item>
                <Nav.Link
                  className={`text-white ${isActive("/register")}`}
                  onClick={() => handleNavigate("/register")}
                >
                  <UserPlus size={iconSize} className="me-2" />
                  Registrar usuario
                </Nav.Link>
              </Nav.Item>
            )}


            <div className="mt-auto p-3 border-top">
              <div className="d-flex align-items-center">
                <div>
                  <div className="fw-bold">{usuario.nombre}</div>
                  <small className="text-muted">{usuario.id_rol}</small>
                </div>
              </div>
              <Button
                variant="outline-light"
                size="sm"
                className="w-100 mt-2"
                onClick={() => {
                  if (onItemClick) onItemClick();
                  logout();
                }}
              >
                <LogOut size={iconSize} className="me-2" />
                Cerrar Sesión
              </Button>
            </div>
          </Nav>
        </>
      )}

      {/* Cuando el sidebar está colapsado, mostrar solo íconos con restricciones */}
      {isSidebarCollapsed && (
        <Nav className="flex-column align-items-center mt-3">
          
          {/* Ver Proyectos */}
          {hasAccessTo([ROLES.ADMINISTRADOR, ROLES.DIRECTOR_DE_REFORMAS]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/ver-proyectos")}`}
                onClick={() => handleNavigate("/ver-proyectos")}
                style={{ cursor: 'pointer' }}
                title="Ver Proyectos"
              >
                <FolderKanban size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}

          <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">PR</div>

          {/* Nuevo Proyecto */}
          {hasAccessTo([ROLES.ADMINISTRADOR, ROLES.DIRECTOR_DE_INVESTIGACION]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/tipos-proyecto")}`}
                onClick={() => handleNavigate("/tipos-proyecto")}
                style={{ cursor: 'pointer' }}
                title="Nuevo Proyecto"
              >
                <FolderKanban size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}


          {/* Nuevo POA */}
          {hasAccessTo([ROLES.ADMINISTRADOR, ROLES.DIRECTOR_DE_INVESTIGACION]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/crear-poa")}`}
                onClick={() => handleNavigate("/crear-poa")}
                title="Nuevo POA"
              >
                <FileChartLine size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}

          {/* Agregar Actividad */}
          {hasAccessTo([ROLES.ADMINISTRADOR, ROLES.DIRECTOR_DE_INVESTIGACION, ROLES.DIRECTOR_DE_PROYECTO]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/agregar-actividad-tarea")}`}
                onClick={() => handleNavigate("/agregar-actividad-tarea")}
                title="Agregar Actividad"
              >
                <FileChartLine size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}



          <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">Act PR</div>

          {/* Editar Proyecto */}
          {hasAccessTo([
            ROLES.ADMINISTRADOR,
            ROLES.DIRECTOR_DE_INVESTIGACION
          ]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/editar-proyecto")}`}
                onClick={() => handleNavigate("/editar-proyecto")}
                style={{ cursor: 'pointer' }}
                title="Editar Proyecto"
              >
                <FolderKanban size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}


          {/* Editar POA */}
          {hasAccessTo([
            ROLES.ADMINISTRADOR,
            ROLES.DIRECTOR_DE_INVESTIGACION]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/editar-poa")}`}
                onClick={() => handleNavigate("/editar-poa")}
                title="Editar POA"
              >
                <FileChartLine size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}

          {/* Editar Actividad */}
          {hasAccessTo([
            ROLES.ADMINISTRADOR,
            ROLES.DIRECTOR_DE_INVESTIGACION,
            ROLES.DIRECTOR_DE_PROYECTO
          ]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/agregar-actividad-tarea")}`}
                onClick={() => handleNavigate("/agregar-actividad-tarea")}
                title="Editar Actividad"
              >
                <FileChartLine size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}
         

          {/* Registrar usuario
          {hasAccessTo([ROLES.ADMINISTRADOR]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/register")}`}
                onClick={() => handleNavigate("/register")}
                title="Registrar usuario"
              >
                <UserPlus size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )} */}

          <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">XLSX</div>

          {/* Subir POA desde Excel */}
          {hasAccessTo([
            ROLES.ADMINISTRADOR,
            ROLES.DIRECTOR_DE_REFORMAS,
          ]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/subir-excel")}`}
                onClick={() => handleNavigate("/subir-excel")}
                title="Subir POA desde Excel"
              >
                <FileChartLine size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}

          {/* Reporte Anual */}
          {hasAccessTo([
            ROLES.ADMINISTRADOR,
            ROLES.DIRECTOR_DE_REFORMAS,
          ]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/reporte-poa")}`}
                onClick={() => handleNavigate("/reporte-poa")}
                title="Reporte Anual"
              >
                <FileChartLine size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}

          {/* Control de cambios */}
          {hasAccessTo([
            ROLES.ADMINISTRADOR,
            ROLES.DIRECTOR_DE_REFORMAS,
          ]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/LogsCargaExcel")}`}
                onClick={() => handleNavigate("/LogsCargaExcel")}
                title="Control de cambios - Subir POA"
              >
                <FileChartLine size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}

          <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">USR</div>


          {/* Perfil - Siempre visible */}
          <Nav.Item>
            <Nav.Link
              className={`text-white ${isActive("/perfil")}`}
              onClick={() => handleNavigate("/perfil")}
              title="Perfil"
            >
              <CircleUserRound size={iconSize} />
            </Nav.Link>
          </Nav.Item>

          {/* Registrar usuario */}
          
  
          <div className="mt-auto mb-5">
          {hasAccessTo([ROLES.ADMINISTRADOR]) && (
          <Nav.Item>
            <Nav.Link
              className={`text-white ${isActive("/register")}`}
              onClick={() => handleNavigate("/register")}
              title="Registrar usuario"
            >
              <UserPlus size={iconSize} />
            </Nav.Link>
          </Nav.Item>
          )}
          </div>

          <div style={{ marginBottom: '6rem' }} />

          <div className="mt-auto mb-3">
            <Nav.Item>
              <Nav.Link
                className="text-white"
                onClick={() => logout()}
                title="Cerrar Sesión"
              >
                <LogOut size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          </div>
        </Nav>
      )}
    </React.Fragment>
  );
};

export default SidebarContent;