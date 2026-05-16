import org.jetbrains.intellij.platform.gradle.extensions.intellijPlatform

pluginManagement {
    repositories {
        maven("https://cache-redirector.jetbrains.com/intellij-dependencies")
        gradlePluginPortal()
        mavenCentral()
    }
}

plugins {
    id("org.jetbrains.intellij.platform.settings") version "2.2.1"
}

rootProject.name = "devin-cli-chat"

@Suppress("UnstableApiUsage")
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        mavenCentral()
        intellijPlatform {
            defaultRepositories()
        }
    }
}
