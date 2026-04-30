package com.tencent.kuikly.demo.pages.web_test.modules

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Border
import com.tencent.kuikly.core.base.BorderStyle
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.module.NetworkModule
import com.tencent.kuikly.core.nvi.serialization.json.JSONObject
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.Scroller
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.core.views.compose.Button
import com.tencent.kuikly.core.views.layout.Row
import com.tencent.kuikly.demo.pages.base.BasePager

@Page("NetworkModuleTestPage")
internal class NetworkModuleTestPage : BasePager() {
    private var output by observable("")

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
            }
            Text {
                attr {
                    text("NetworkModuleTestPage")
                    fontSize(20f)
                    color(Color.BLACK)
                    marginLeft(10f)
                    marginTop(12f)
                }
            }
            Row {
                Button {
                    attr {
                        size(150f, 40f)
                        borderRadius(20f)
                        marginLeft(10f)
                        marginTop(5f)
                        backgroundColor(Color(0x6200ee, 1f))
                        titleAttr {
                            text("requestGet")
                            color(Color.WHITE)
                        }
                        highlightBackgroundColor(Color.GRAY)
                    }
                    event {
                        click {
                            ctx.output = "requestGet..."
                            ctx.requestGet()
                        }
                    }
                }
                Button {
                    attr {
                        size(150f, 40f)
                        borderRadius(20f)
                        marginLeft(10f)
                        marginTop(5f)
                        backgroundColor(Color(0x6200ee, 1f))
                        titleAttr {
                            text("requestGetBinary")
                            color(Color.WHITE)
                        }
                        highlightBackgroundColor(Color.GRAY)
                    }
                    event {
                        click {
                            ctx.output = "requestGetBinary..."
                            ctx.requestGetBinary()
                        }
                    }
                }
            }
            Row {
                Button {
                    attr {
                        size(150f, 40f)
                        borderRadius(20f)
                        marginLeft(10f)
                        marginTop(5f)
                        backgroundColor(Color(0x6200ee, 1f))
                        titleAttr {
                            text("requestPost")
                            color(Color.WHITE)
                        }
                        highlightBackgroundColor(Color.GRAY)
                    }
                    event {
                        click {
                            ctx.output = "requestPost..."
                            ctx.requestPost()
                        }
                    }
                }
                Button {
                    attr {
                        size(150f, 40f)
                        borderRadius(20f)
                        marginLeft(10f)
                        marginTop(5f)
                        backgroundColor(Color(0x6200ee, 1f))
                        titleAttr {
                            text("requestPostBinary")
                            color(Color.WHITE)
                        }
                        highlightBackgroundColor(Color.GRAY)
                    }
                    event {
                        click {
                            ctx.output = "requestPostBinary..."
                            ctx.requestPostBinary()
                        }
                    }
                }
            }
            Row {
                Button {
                    attr {
                        size(150f, 40f)
                        borderRadius(20f)
                        marginLeft(10f)
                        marginTop(5f)
                        backgroundColor(Color(0x6200ee, 1f))
                        titleAttr {
                            text("status204")
                            color(Color.WHITE)
                        }
                        highlightBackgroundColor(Color.GRAY)
                    }
                    event {
                        click {
                            ctx.output = "status204..."
                            ctx.requestStatus204()
                        }
                    }
                }
                Button {
                    attr {
                        size(150f, 40f)
                        borderRadius(20f)
                        marginLeft(10f)
                        marginTop(5f)
                        backgroundColor(Color(0x6200ee, 1f))
                        titleAttr {
                            text("status500")
                            color(Color.WHITE)
                        }
                        highlightBackgroundColor(Color.GRAY)
                    }
                    event {
                        click {
                            ctx.output = "status500..."
                            ctx.requestStatus500()
                        }
                    }
                }
            }
            View {
                attr {
                    marginLeft(10f)
                    marginRight(10f)
                    marginTop(5f)
                    alignSelfStretch()
                    border(Border(1f, BorderStyle.SOLID, Color.BLACK))
                    height(220f)
                }
                Scroller {
                    attr {
                        padding(5f)
                        alignSelfStretch()
                        flex(1f)
                    }
                    Text {
                        attr {
                            text(ctx.output)
                            color(Color.BLACK)
                        }
                    }
                }
            }
        }
    }

    private fun requestGet() {
        acquireModule<NetworkModule>(NetworkModule.MODULE_NAME).requestGet(
            localUrl("/api/network/get"),
            JSONObject().apply { put("key", "value") }
        ) { data, success, errorMsg, response ->
            output = """Get request completed:
                |success=$success,
                |
                |data=$data,
                |
                |errorMsg=$errorMsg,
                |
                |statusCode=${response.statusCode}""".trimMargin()
        }
    }

    private fun requestGetBinary() {
        acquireModule<NetworkModule>(NetworkModule.MODULE_NAME).requestGetBinary(
            localUrl("/api/network/get-binary"),
            JSONObject()
        ) { _, success, errorMsg, response ->
            output = """Get request completed:
                |success=$success,
                |
                |errorMsg=$errorMsg,
                |
                |statusCode=${response.statusCode}""".trimMargin()
        }
    }

    private fun requestPost() {
        acquireModule<NetworkModule>(NetworkModule.MODULE_NAME).requestPost(
            localUrl("/api/network/post"),
            JSONObject().apply { put("key", "value") }
        ) { data, success, errorMsg, response ->
            output = """Post request completed:
                |success=$success,
                |
                |data=$data,
                |
                |errorMsg=$errorMsg,
                |
                |statusCode=${response.statusCode}""".trimMargin()
        }
    }

    private fun requestPostBinary() {
        acquireModule<NetworkModule>(NetworkModule.MODULE_NAME).requestPostBinary(
            localUrl("/api/network/post-binary"),
            "hello world".encodeToByteArray(),
        ) { data, success, errorMsg, response ->
            output = """Post request completed:
                |success=$success,
                |
                |data=${data.decodeToString()},
                |
                |errorMsg=$errorMsg,
                |
                |statusCode=${response.statusCode}""".trimMargin()
        }
    }

    private fun requestStatus204() {
        acquireModule<NetworkModule>(NetworkModule.MODULE_NAME).requestGet(
            localUrl("/api/network/status/204"),
            JSONObject(),
        ) { data, success, errorMsg, response ->
            output = """Get request completed:
                |success=$success,
                |
                |data=$data,
                |
                |errorMsg=$errorMsg,
                |
                |statusCode=${response.statusCode}""".trimMargin()
        }
    }

    private fun requestStatus500() {
        acquireModule<NetworkModule>(NetworkModule.MODULE_NAME).requestGet(
            localUrl("/api/network/status/500"),
            JSONObject(),
        ) { data, success, errorMsg, response ->
            output = """Get request completed:
                |success=$success,
                |
                |data=$data,
                |
                |errorMsg=$errorMsg,
                |
                |statusCode=${response.statusCode}""".trimMargin()
        }
    }

    private fun localUrl(path: String): String = "http://localhost:8080$path"
}
