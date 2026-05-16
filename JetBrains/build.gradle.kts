import org.jetbrains.intellij.platform.gradle.IntelliJPlatformType

plugins {
    id("java")
    id("org.jetbrains.kotlin.jvm") version "2.1.20"
    id("org.jetbrains.intellij.platform")
}

group = "com.lferrarezi"
version = "0.32.0"

kotlin {
    jvmToolchain(17)
}

dependencies {
    intellijPlatform {
        pycharmCommunity("2023.1")
        pluginVerifier()
        zipSigner()
    }

    testImplementation(kotlin("test-junit5"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

intellijPlatform {
    pluginVerification {
        ides {
            ide(IntelliJPlatformType.PyCharmCommunity, "2022.3")
            ide(IntelliJPlatformType.PyCharmCommunity, "2023.1")
            ide(IntelliJPlatformType.PyCharmCommunity, "2024.1")
            ide(IntelliJPlatformType.IntellijIdeaCommunity, "2023.1")
        }
    }
}

tasks.test {
    useJUnitPlatform()
}
