package com.tencent.kuikly.demo.pages.web_test.interactions

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.Translate
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.core.views.compose.Button
import kotlin.math.max
import kotlin.math.min

@Page("EventCaptureTestPage")
internal class EventCaptureTestPage : Pager() {
    private var translateRatio by observable(0f)
    private var dragStartX: Float? = null

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            View {
                attr {
                    absolutePositionAllZero()
                }
                View {
                    attr {
                        absolutePositionAllZero()
                        transform(Translate(ctx.translateRatio, 0f))
                        padding(top = 80f)
                    }
                    event {
                        pan {
                            when (it.state) {
                                "start" -> ctx.dragStartX = if (it.pageX <= 80f) it.pageX else null
                                "move" -> {
                                    val startX = ctx.dragStartX ?: return@pan
                                    ctx.translateRatio = min(1f, max(0f, (it.pageX - startX) / 240f))
                                }
                                "end" -> {
                                    if (ctx.dragStartX != null) {
                                        ctx.translateRatio = if (ctx.translateRatio > 0.45f) 1f else 0f
                                    }
                                    ctx.dragStartX = null
                                }
                            }
                        }
                    }
                    Text {
                        attr {
                            text("capture-title")
                            color(Color.BLACK)
                            fontSize(24f)
                            marginLeft(16f)
                        }
                    }
                    View {
                        attr {
                            margin(left = 16f, right = 16f, top = 20f)
                            padding(all = 16f)
                            backgroundColor(0xFFFFF3E0)
                        }
                        Text { attr { text("page-1") } }
                    }
                }
            }
            Button {
                attr {
                    titleAttr { text("reset") }
                    size(width = 88f, height = 40f)
                    backgroundColor(0xFF1E88E5)
                    absolutePosition(top = 20f, right = 16f)
                }
                event { click { ctx.translateRatio = 0f } }
            }
        }
    }
}
