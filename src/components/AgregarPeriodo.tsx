import React, { useState } from 'react';
import { Form, Button, Container, Card } from 'react-bootstrap';

// Interface definition for Periodo
export interface PeriodoFormProps {
  id_periodo: string;
}

const AgregarPeriodo: React.FC = () => {
    const [codigo_periodo, setCodigo_periodo] = useState('');
    const [nombre_periodo, setNombre_periodo] = useState('');
    const [fecha_inicio, setFecha_inicio] = useState('');
    const [fecha_fin, setFecha_fin] = useState('');
    const [anio, setAnio] = useState('');
    const [mes, setMes] = useState('');

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        // Aquí puedes manejar el envío del formulario
        console.log({
            codigo_periodo,
            nombre_periodo,
            fecha_inicio,
            fecha_fin,
            anio,
            mes,
        });
    };

    return (
        <Container className="d-flex justify-content-center align-items-start py-5" style={{ minHeight: '100vh' }}>
            <Card className="p-5 shadow-lg" style={{ width: '80%', maxWidth: '900px' }}>
                <div className="text-center mb-4 bg-primary bg-gradient text-white p-3 rounded-3 shadow-sm">
                    <h2 className="mb-0 fw-bold">Agregar Periodo</h2>
                </div>
                <Form className="py-3" onSubmit={handleSubmit}>
                    <Form.Group controlId="codigo_periodo" className="mb-4">
                        <Form.Label className="fw-semibold">Código del Periodo</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Ingrese el código"
                            size="lg"
                            value={codigo_periodo}
                            onChange={(e) => setCodigo_periodo(e.target.value)}
                        />
                    </Form.Group>
                    
                    <Form.Group controlId="nombre_periodo" className="mb-4">
                        <Form.Label className="fw-semibold">Nombre del Periodo</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Ingrese el nombre"
                            size="lg"
                            value={nombre_periodo}
                            onChange={(e) => setNombre_periodo(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group controlId="fecha_inicio" className="mb-4">
                        <Form.Label className="fw-semibold">Fecha de Inicio</Form.Label>
                        <Form.Control
                            type="date"
                            size="lg"
                            value={fecha_inicio}
                            onChange={(e) => setFecha_inicio(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group controlId="fecha_fin" className="mb-4">
                        <Form.Label className="fw-semibold">Fecha de Fin</Form.Label>
                        <Form.Control
                            type="date"
                            size="lg"
                            value={fecha_fin}
                            onChange={(e) => setFecha_fin(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group controlId="anio" className="mb-4">
                        <Form.Label className="fw-semibold">Año</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Ingrese el año"
                            size="lg"
                            value={anio}
                            onChange={(e) => setAnio(e.target.value)}
                        />
                        <Form.Text className="text-muted">
                            Campo opcional
                        </Form.Text>
                    </Form.Group>

                    <Form.Group controlId="mes" className="mb-4">
                        <Form.Label className="fw-semibold">Mes</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Ingrese el mes"
                            size="lg"
                            value={mes}
                            onChange={(e) => setMes(e.target.value)}
                        />
                        <Form.Text className="text-muted">
                            Campo opcional
                        </Form.Text>
                    </Form.Group>

                    <div className="text-center mt-5 d-flex justify-content-center gap-4">
                        <Button variant="secondary" type="button" size="lg" className="px-4 py-2">
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" size="lg" className="px-4 py-2">
                            Agregar Periodo
                        </Button>
                    </div>
                </Form>
            </Card>
        </Container>
    );
};

export default AgregarPeriodo;