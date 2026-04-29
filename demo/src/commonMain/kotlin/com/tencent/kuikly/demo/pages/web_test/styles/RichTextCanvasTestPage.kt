package com.tencent.kuikly.demo.pages.web_test.styles

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.PlaceholderSpan
import com.tencent.kuikly.core.views.RichText
import com.tencent.kuikly.core.views.Span
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * RichText canvas measure and advanced features test page
 *
 * Covers RichTextProcessor (h5) canvas measure path and KRRichTextView branches:
 * - strokeWidth / strokeColor on RichText Span
 * - placeholder span
 * - letterSpacing multi-line
 */
@Page("RichTextCanvasTestPage")
internal class RichTextCanvasTestPage : Pager() {
    private var strokeToggle by observable(false)
    private var wrapToggle by observable(false)

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr { backgroundColor(Color.WHITE) }

            List {
                attr { flex(1f) }

                Text {
                    attr {
                        text("RichText Canvas & Advanced")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // Section 1: RichText with strokeWidth and strokeColor on Span
                Text {
                    attr {
                        text("1. Stroke Text")
                        fontSize(14f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, top = 8f)
                        size(200f, 44f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(4f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.strokeToggle = !ctx.strokeToggle
                        }
                    }
                    Text {
                        attr {
                            text("Toggle Stroke")
                            fontSize(14f)
                            color(Color.BLACK)
                        }
                    }
                }

                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    RichText {
                        attr {
                            fontSize(18f)
                            color(Color.BLACK)
                        }
                        Span {
                            text("Stroked RichText Content")
                            if (ctx.strokeToggle) {
                                textStroke(Color(0xFFFF0000), 2f)
                            }
                        }
                    }
                }

                // Section 2: Word wrapping via Text (not RichText attr)
                Text {
                    attr {
                        text("2. Word Wrapping")
                        fontSize(14f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, top = 8f)
                        size(200f, 44f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(4f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.wrapToggle = !ctx.wrapToggle
                        }
                    }
                    Text {
                        attr {
                            text("Toggle Wrap")
                            fontSize(14f)
                            color(Color.BLACK)
                        }
                    }
                }

                Text {
                    attr {
                        text("This is a long text that should wrap or truncate depending on mode and container width constraints")
                        fontSize(14f)
                        color(Color.BLACK)
                        margin(left = 16f, top = 8f, right = 16f)
                        width(150f)
                        if (ctx.wrapToggle) {
                            textOverFlowWordWrapping()
                        }
                    }
                }

                // Section 3: PlaceholderSpan
                Text {
                    attr {
                        text("3. Placeholder Span")
                        fontSize(14f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    RichText {
                        attr {
                            fontSize(14f)
                            color(Color.BLACK)
                        }
                        Span {
                            text("Before ")
                        }
                        PlaceholderSpan {
                            placeholderSize(40f, 20f)
                        }
                        Span {
                            text(" After")
                        }
                    }
                }

                // Section 4: Multi-line with letterSpacing (triggers canvas measure path)
                Text {
                    attr {
                        text("4. LetterSpacing Multi-line")
                        fontSize(14f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    RichText {
                        attr {
                            fontSize(14f)
                            color(Color.BLACK)
                            width(300f)
                        }
                        Span {
                            text("Letter spaced text across multiple lines for measurement")
                            letterSpacing(2f)
                        }
                    }
                }

                View { attr { height(50f) } }
            }
        }
    }
}
