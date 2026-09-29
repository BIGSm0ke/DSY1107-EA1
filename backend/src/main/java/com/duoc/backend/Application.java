package com.duoc.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;

import java.util.Scanner;

/**
 * Aplicación principal de RabbitMQ con Spring Boot
 * 
 * Basada en:
 * https://www.rabbitmq.com/tutorials/tutorial-one-spring-amqp
 * https://docs.spring.io/spring-boot/reference/
 */
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        // Levanta la aplicación Spring Boot
        ApplicationContext ctx = SpringApplication.run(Application.class, args);
        
        // Obtén el bean Sender
        Sender sender = ctx.getBean(Sender.class);
        
        System.out.println("\n" + "=".repeat(60));
        System.out.println("RabbitMQ - Hello World con Spring Boot");
        System.out.println("=".repeat(60));
        System.out.println("[x] Aplicación iniciada correctamente");
        System.out.println("[x] RabbitMQ conectado en localhost:5672");
        System.out.println("[x] Cola 'hello' lista para usar\n");

        // Menú interactivo
        Scanner scanner = new Scanner(System.in);
        boolean running = true;
        
        while (running) {
            System.out.println("\n--- Menú ---");
            System.out.println("1. Enviar mensaje");
            System.out.println("2. Enviar múltiples mensajes");
            System.out.println("3. Salir");
            System.out.print("Selecciona opción (1-3): ");
            
            String option = scanner.nextLine().trim();
            
            switch (option) {
                case "1":
                    System.out.print("Escribe el mensaje: ");
                    String message = scanner.nextLine();
                    sender.sendMessage(message);
                    break;
                    
                case "2":
                    System.out.print("¿Cuántos mensajes? ");
                    try {
                        int count = Integer.parseInt(scanner.nextLine());
                        for (int i = 1; i <= count; i++) {
                            sender.sendMessage("Mensaje #" + i + " - Hello RabbitMQ!");
                            Thread.sleep(500); // Pequeña pausa
                        }
                    } catch (NumberFormatException e) {
                        System.out.println("[!] Número inválido");
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                    break;
                    
                case "3":
                    System.out.println("[x] Saliendo...");
                    running = false;
                    break;
                    
                default:
                    System.out.println("[!] Opción no válida");
            }
        }
        
        scanner.close();
        System.exit(0);
    }
}