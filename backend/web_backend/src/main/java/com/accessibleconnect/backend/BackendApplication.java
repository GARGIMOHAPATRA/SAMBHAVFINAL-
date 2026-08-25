package com.accessibleconnect.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		Map<String, Object> envMap = loadEnvMap();
		SpringApplication app = new SpringApplication(BackendApplication.class);
		
		app.addInitializers(applicationContext -> {
			ConfigurableEnvironment env = applicationContext.getEnvironment();
			env.getPropertySources().addFirst(new MapPropertySource("customEnvProperties", envMap));
		});
		
		app.run(args);
	}

	private static Map<String, Object> loadEnvMap() {
		Map<String, Object> envMap = new HashMap<>();
		File currentDir = new File(".").getAbsoluteFile();
		File envFile = null;
		
		while (currentDir != null) {
			File potential = new File(currentDir, ".env");
			if (potential.exists()) {
				envFile = potential;
				break;
			}
			currentDir = currentDir.getParentFile();
		}

		if (envFile != null && envFile.exists()) {
			System.out.println("[SignBridge] Loading environment configuration from: " + envFile.getAbsolutePath());
			try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
				String line;
				while ((line = reader.readLine()) != null) {
					line = line.trim();
					if (line.isEmpty() || line.startsWith("#")) {
						continue;
					}
					int eqIdx = line.indexOf('=');
					if (eqIdx > 0) {
						String key = line.substring(0, eqIdx).trim();
						String value = line.substring(eqIdx + 1).trim();
						
						if (value.startsWith("\"") && value.endsWith("\"")) {
							value = value.substring(1, value.length() - 1);
						} else if (value.startsWith("'") && value.endsWith("'")) {
							value = value.substring(1, value.length() - 1);
						}
						
						envMap.put(key, value);
					}
				}
				System.out.println("[SignBridge] Environment configuration loaded successfully. Parsed keys count: " + envMap.size());
			} catch (IOException e) {
				System.err.println("[SignBridge] Warning: Failed to read .env file: " + e.getMessage());
			}
		} else {
			System.out.println("[SignBridge] No .env file detected. Relying on system variables.");
		}
		return envMap;
	}
}

