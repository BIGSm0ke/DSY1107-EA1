package com.duoc.backend;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Productor (Sender) - Envía mensajes a la cola 'hello'
 * 
 * Basado en:
 * https://www.rabbitmq.com/tutorials/tutorial-one-spring-amqp
 * https://docs.spring.io/spring-amqp/reference/
 */
@Component
public class Sender {

    /**
     * RabbitTemplate es la clase principal de Spring AMQP
     * para enviar mensajes.
     * 
     * Proporciona métodos simplificados para:
     * - convertAndSend(): convierte objeto a JSON y envía
     * - convertSendAndReceive(): espera respuesta
     */
    @Autowired
    private RabbitTemplate rabbitTemplate;

    /**
     * Método para enviar un mensaje simple
     * 
     * Parámetros:
     * - message: el contenido del mensaje
     */
    public void sendMessage(String message) {
        try {
            String timestamp = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("HH:mm:ss.SSS"));
            String fullMessage = String.format("[%s] %s", timestamp, message);
            
            // Enviar el mensaje a la cola
            // exchange="" usa el exchange por defecto (DIRECT)
            // routingKey="hello" especifica la cola destino
            rabbitTemplate.convertAndSend("hello", fullMessage);
            
            System.out.println("[x] Mensaje enviado: '" + fullMessage + "'");
        } catch (Exception e) {
            System.err.println("[x] Error enviando mensaje: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Versión sobrecargada con exchange explícito
     * (para casos más avanzados)
     */
    public void sendMessage(String exchange, String routingKey, String message) {
        try {
            rabbitTemplate.convertAndSend(exchange, routingKey, message);
            System.out.println("[x] Mensaje enviado a exchange='" + exchange + "', routingKey='" + routingKey + "': '" + message + "'");
        } catch (Exception e) {
            System.err.println("[x] Error enviando mensaje: " + e.getMessage());
            e.printStackTrace();
        }
    }
}