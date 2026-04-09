package com.reviewin.util;

import java.security.SecureRandom;
import org.springframework.stereotype.Component;

@Component
public class ClassCodeGenerator {

    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    public String generateCode() {
        StringBuilder sb = new StringBuilder("CL-");
        for (int i = 0; i < 6; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }
}
