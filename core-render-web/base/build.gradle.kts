import org.jetbrains.kotlin.gradle.dsl.JsSourceMapEmbedMode
import org.jetbrains.kotlin.gradle.dsl.JsSourceMapNamesPolicy

plugins {
    // Import KMM plugin
    kotlin("multiplatform")
    // Import Android library plugin, provides maven publishing configuration
    // id("com.android.library")
    // Import maven publishing plugin
    id("maven-publish")
}

// maven 产物 groupId，com.tencent.kuikly
group = MavenConfig.GROUP_WEB
// maven 产物版本，这里统一使用 render 的版本号
version = Version.getCoreVersion()

// 配置 maven 发布
publishing {
    repositories {
        // 仓库配置，未配置用户名和密码的情况下发布到本地
        val username = MavenConfig.getUsername(project)
        val password = MavenConfig.getPassword(project)
        if (username.isNotEmpty() && password.isNotEmpty()) {
            // 流水线配置了用户名密码才会走到这个逻辑
            maven {
                credentials {
                    setUsername(username)
                    setPassword(password)
                }
                url = uri(MavenConfig.getRepoUrl(version as String))
            }
        } else {
            // 否则本地逻辑发布到本地
            mavenLocal()
        }
    }
}


kotlin {
    js(IR) {
        moduleName = "KuiklyCore-render-web-base"
        // Output build products that support browser execution
        browser {
            webpackTask {
                outputFileName = "${moduleName}.js" // Final output name
            }

            commonWebpackConfig {
                output?.library = null // Don't export global objects, only export necessary entry functions
            }
        }
        // Output executable JS rather than library
        binaries.executable()

        compilerOptions {
            sourceMap.set(true)
            // 将 Kotlin 源文件内容内嵌到 sourcemap 中，确保 remap 时能定位到 .kt 源行
            sourceMapEmbedSources.set(JsSourceMapEmbedMode.SOURCE_MAP_SOURCE_CONTENT_ALWAYS)
            // 在 sourcemap 的 names 字段中保留原始函数名/变量名（Kotlin 2.0.20+）
            sourceMapNamesPolicy.set(JsSourceMapNamesPolicy.SOURCE_MAP_NAMES_POLICY_FQ_NAMES)
        }
    }

    sourceSets {
        val jsMain by getting {
            dependencies {
                // Import js standard library
                implementation(kotlin("stdlib-js"))
            }
        }
    }
}
