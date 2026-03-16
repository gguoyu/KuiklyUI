/*
 * Tencent is pleased to support the open source community by making KuiklyUI
 * available.
 * Copyright (C) 2025 Tencent. All rights reserved.
 * Licensed under the License of KuiklyUI;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://github.com/Tencent-TDS/KuiklyUI/blob/main/LICENSE
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.tencent.kuikly.demo.pages.demo.web

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.module.NetworkModule
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * NetworkModule 全方法测试页面
 * 覆盖：httpRequest 方法
 * 注意：为确保测试稳定性，仅展示 API 用法，不发送实际网络请求
 */
@Page("WebRenderTestNetwork")
internal class WebRenderTestNetworkPage : BasePager() {

    // 测试结果状态
    private var httpGetResult by observable("未执行")
    private var httpPostResult by observable("未执行")
    private var httpHeadersResult by observable("未执行")
    private var httpTimeoutResult by observable("未执行")
    private var networkModuleInfoResult by observable("未执行")
    private var requestExampleResult by observable("未执行")

    override fun body(): ViewBuilder {
        val ctx = this

        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // 标题
                View {
                    attr {
                        padding(16f)
                        backgroundColor(Color(0xFF009688))
                    }
                    Text {
                        attr {
                            text("NetworkModule 测试")
                            fontSize(20f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                // 说明
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFE0F2F1))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("📝 说明: NetworkModule 用于发送 HTTP 请求。\n为保证测试稳定性（无网络依赖），\n本页面仅展示 API 用法，不发送实际请求。")
                            fontSize(13f)
                            color(Color(0xFF00695C))
                            lineHeight(20f)
                        }
                    }
                }

                // 测试1: HTTP GET
                SectionView("1. httpRequest - GET 请求", ctx.httpGetResult)

                // 测试2: HTTP POST
                SectionView("2. httpRequest - POST 请求", ctx.httpPostResult)

                // 测试3: 自定义 Headers
                SectionView("3. httpRequest - 自定义 Headers", ctx.httpHeadersResult)

                // 测试4: 超时设置
                SectionView("4. httpRequest - 超时设置", ctx.httpTimeoutResult)

                // 测试5: 模块信息
                SectionView("5. NetworkModule 信息", ctx.networkModuleInfoResult)

                // 测试6: 完整示例
                SectionView("6. 完整请求示例", ctx.requestExampleResult)

                // 底部留白
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }

    override fun created() {
        super.created()
        runNetworkTests()
    }

    private fun runNetworkTests() {
        // 测试1: HTTP GET
        httpGetResult = """
            |✅ GET 请求用法
            |
            |networkModule.httpRequest(
            |  url = "https://api.example.com/data",
            |  method = "GET",
            |  callback = { response ->
            |    // 处理响应
            |    val data = response.optString("data")
            |  }
            |)
            |
            |说明: GET 请求用于获取数据
        """.trimMargin()

        // 测试2: HTTP POST
        httpPostResult = """
            |✅ POST 请求用法
            |
            |networkModule.httpRequest(
            |  url = "https://api.example.com/submit",
            |  method = "POST",
            |  param = mapOf(
            |    "name" to "张三",
            |    "age" to "25"
            |  ),
            |  callback = { response ->
            |    // 处理响应
            |  }
            |)
            |
            |说明: POST 请求用于提交数据
        """.trimMargin()

        // 测试3: 自定义 Headers
        httpHeadersResult = """
            |✅ 自定义 Headers 用法
            |
            |networkModule.httpRequest(
            |  url = "https://api.example.com/auth",
            |  method = "GET",
            |  headers = mapOf(
            |    "Authorization" to "Bearer token123",
            |    "Content-Type" to "application/json",
            |    "X-Custom-Header" to "value"
            |  ),
            |  callback = { response -> }
            |)
            |
            |说明: 可设置任意请求头
        """.trimMargin()

        // 测试4: 超时设置
        httpTimeoutResult = """
            |✅ 超时设置用法
            |
            |networkModule.httpRequest(
            |  url = "https://api.example.com/slow",
            |  method = "GET",
            |  timeout = 30000,  // 30秒超时
            |  callback = { response ->
            |    // 超时会收到错误回调
            |  }
            |)
            |
            |说明: timeout 单位为毫秒
            |默认超时: 通常为 30000ms (30秒)
        """.trimMargin()

        // 测试5: 模块信息
        networkModuleInfoResult = """
            |✅ NetworkModule 信息
            |
            |模块名称: ${NetworkModule.MODULE_NAME}
            |模块类型: 网络请求模块
            |
            |支持方法:
            |• httpRequest - 发送 HTTP 请求
            |• httpRequestBinary - 发送二进制请求
            |
            |支持参数:
            |• url - 请求地址
            |• method - GET/POST/PUT/DELETE
            |• param - 请求参数
            |• headers - 请求头
            |• cookie - Cookie
            |• timeout - 超时时间(ms)
        """.trimMargin()

        // 测试6: 完整示例
        requestExampleResult = """
            |✅ 完整请求示例
            |
            |// 获取模块
            |val network = acquireModule<NetworkModule>(
            |    NetworkModule.MODULE_NAME
            |)
            |
            |// 发送请求
            |network.httpRequest(
            |    url = "https://api.example.com/user",
            |    method = "POST",
            |    param = mapOf(
            |        "username" to "kuikly",
            |        "password" to "123456"
            |    ),
            |    headers = mapOf(
            |        "Content-Type" to "application/json"
            |    ),
            |    timeout = 15000
            |) { response ->
            |    // response 是 JSONObject
            |    val code = response.optInt("code")
            |    val msg = response.optString("msg")
            |    val data = response.optJSONObject("data")
            |    
            |    if (code == 0) {
            |        // 请求成功
            |    } else {
            |        // 请求失败
            |    }
            |}
        """.trimMargin()
    }

    private fun ViewBuilder.SectionView(title: String, content: String) {
        View {
            attr {
                margin(12f)
                padding(12f)
                backgroundColor(Color(0xFFF5F5F5))
                borderRadius(8f)
            }
            Text {
                attr {
                    text(title)
                    fontSize(14f)
                    fontWeightBold()
                    color(Color(0xFF333333))
                    marginBottom(8f)
                }
            }
            View {
                attr {
                    padding(8f)
                    backgroundColor(Color.WHITE)
                    borderRadius(4f)
                }
                Text {
                    attr {
                        text(content)
                        fontSize(11f)
                        color(Color(0xFF666666))
                        lineHeight(16f)
                    }
                }
            }
        }
    }
}
