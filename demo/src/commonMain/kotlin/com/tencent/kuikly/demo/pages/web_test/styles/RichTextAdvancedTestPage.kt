package com.tencent.kuikly.demo.pages.web_test.styles

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.PlaceholderSpan
import com.tencent.kuikly.core.views.RichText
import com.tencent.kuikly.core.views.Span
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * RichText advanced style test page
 *
 * Targets uncovered RichTextProcessor branches:
 * 1. PlaceholderSpan (placeholderWidth/placeholderHeight)
 * 2. Span-level fontFamily
 * 3. Span-level firstLineHeadIndent (headIndent)
 * 4. Multi-line with too many declared lines (triggers setMultiLineStyle reset)
 * 5. Single-line truncation (lines=1)
 * 6. Text with lineBreakMode + letterSpacing
 */
@Page("RichTextAdvancedTestPage")
internal class RichTextAdvancedTestPage : Pager() {

    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: PlaceholderSpan ===
                Text {
                    attr {
                        text("1. PlaceholderSpan")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
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
                            fontSize(16f)
                            color(Color.BLACK)
                        }
                        Span {
                            text("before-placeholder ")
                        }
                        PlaceholderSpan {
                            placeholderSize(40f, 20f)
                        }
                        Span {
                            text(" after-placeholder")
                        }
                    }
                }

                // === Section 2: Span fontFamily ===
                Text {
                    attr {
                        text("2. Span fontFamily")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
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
                            fontSize(16f)
                            color(Color.BLACK)
                        }
                        Span {
                            text("default-font ")
                        }
                        Span {
                            fontFamily("monospace")
                            text("monospace-font ")
                        }
                        Span {
                            fontFamily("serif")
                            text("serif-font")
                        }
                    }
                }

                // === Section 3: Span firstLineHeadIndent ===
                Text {
                    attr {
                        text("3. Span headIndent")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
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
                            firstLineHeadIndent(24f)
                            text("headIndent-span: first line indented text that wraps to show the indent effect on the first line while subsequent lines remain unindented.")
                        }
                    }
                }

                // === Section 4: Multi-line with excess declared lines ===
                // This triggers the setMultiLineStyle(0, ...) reset branch
                // when expectHeight - h > singleLineHeight / 2
                Text {
                    attr {
                        text("4. Excess Declared Lines")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
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
                            lines(10) // declares 10 lines but content is only 1 line
                        }
                        Span {
                            text("Short text with lines=10")
                        }
                    }
                }

                // === Section 5: Single-line truncation via RichText ===
                Text {
                    attr {
                        text("5. Single-line RichText")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
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
                            lines(1)
                            textOverFlowTail()
                        }
                        Span {
                            text("This is a very long single-line rich text that should be truncated with an ellipsis when it overflows the container width.")
                        }
                    }
                }

                // === Section 6: LetterSpacing + multi-line ===
                Text {
                    attr {
                        text("6. LetterSpacing Multi-line")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
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
                            letterSpacing(3f)
                        }
                        Span {
                            text("Spaced out text with letter spacing that spans multiple lines to verify the DOM measurement path handles letterSpacing correctly with line wrapping.")
                        }
                    }
                }

                // === Section 7: Multi-Span with mixed styles ===
                Text {
                    attr {
                        text("7. Mixed Style Spans")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
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
                            text("normal ")
                        }
                        Span {
                            color(Color.RED)
                            fontWeightBold()
                            text("bold-red ")
                        }
                        Span {
                            fontFamily("monospace")
                            text("mono ")
                        }
                        Span {
                            fontStyleItalic()
                            text("italic ")
                        }
                        Span {
                            textDecorationUnderLine()
                            text("underline ")
                        }
                        Span {
                            textStroke(Color(0xFFFF0000), 1f)
                            text("stroked")
                        }
                    }
                }

                // === Section 8: Span lineHeight + letterSpacing combo ===
                Text {
                    attr {
                        text("8. Span lineHeight")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
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
                            lineHeight(30f)
                            text("Line height 30: This span has a custom line height that should affect the vertical spacing of the text.")
                        }
                    }
                }

                View { attr { height(50f) } }
            }
        }
    }
}
