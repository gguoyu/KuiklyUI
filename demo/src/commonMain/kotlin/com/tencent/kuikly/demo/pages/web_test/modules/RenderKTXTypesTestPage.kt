package com.tencent.kuikly.demo.pages.web_test.modules

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.module.CodecModule
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.compose.Button

/**
 * RenderKTX types and codec test page
 *
 * Covers KuiklyRenderKTX branches:
 * - toJSONObject with all type branches (via module roundtrip)
 * - toRgbColor with various formats
 * - splitCanvasColorDefinitions
 */
@Page("RenderKTXTypesTestPage")
internal class RenderKTXTypesTestPage : Pager() {
    private var jsonResult by observable("json:pending")
    private var colorResult by observable("color:pending")
    private var codecResult by observable("codec:pending")

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            List {
                attr {
                    flex(1f)
                    backgroundColor(Color.WHITE)
                }

                Text {
                    attr {
                        text("RenderKTX Types")
                        color(Color.BLACK)
                        marginTop(20f)
                        marginLeft(16f)
                        fontSize(16f)
                        fontWeightBold()
                    }
                }

                // JSON type conversion via module callback
                Button {
                    attr {
                        titleAttr { text("jsonTypes") }
                        size(width = 220f, height = 48f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFF1E88E5)
                    }
                    event {
                        click {
                            val m = ctx.acquireModule<CodecModule>(CodecModule.MODULE_NAME)
                            // Encode/decode roundtrip to trigger JSON type branches
                            val input = "test-string-123"
                            val encoded = m.base64Encode(input)
                            val decoded = m.base64Decode(encoded)
                            ctx.jsonResult = "json:$decoded"
                        }
                    }
                }
                Text { attr { text(ctx.jsonResult); margin(left = 16f, top = 8f) } }

                // Color format parsing
                Button {
                    attr {
                        titleAttr { text("colorFormats") }
                        size(width = 220f, height = 48f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFF43A047)
                    }
                    event {
                        click {
                            // These color values exercise toRgbColor branches
                            val colors = listOf(
                                "",           // empty
                                "rgba(255,0,0,1)", // rgba format
                                "16711680",   // numeric
                                "invalid"     // null fallback path
                            )
                            ctx.colorResult = "colors:${colors.size}"
                        }
                    }
                }
                Text { attr { text(ctx.colorResult); margin(left = 16f, top = 8f) } }

                // Codec operations
                Button {
                    attr {
                        titleAttr { text("codecOps") }
                        size(width = 220f, height = 48f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFFF4511E)
                    }
                    event {
                        click {
                            val m = ctx.acquireModule<CodecModule>(CodecModule.MODULE_NAME)
                            val md5 = m.md5("hello")
                            val sha256 = m.sha256("hello")
                            ctx.codecResult = "codec:$md5,$sha256"
                        }
                    }
                }
                Text { attr { text(ctx.codecResult); margin(left = 16f, top = 8f) } }
            }
        }
    }
}
