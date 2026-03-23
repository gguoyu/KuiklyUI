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

package com.tencent.kuikly.demo.pages.web_test.components

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ColorStop
import com.tencent.kuikly.core.base.Direction
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.RichText
import com.tencent.kuikly.core.views.Span
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * KRGradientRichTextView 渐变富文本渲染验证测试页面
 *
 * 渐变富文本通过在 Text/RichText 的 attr 中调用 backgroundLinearGradient() 触发，
 * 渲染层会自动将 viewName 从 KRRichTextView 切换为 KRGradientRichTextView。
 *
 * 测试覆盖：
 * 1. 水平渐变文本（TO_RIGHT）
 * 2. 垂直渐变文本（TO_BOTTOM）
 * 3. 对角渐变文本（TO_BOTTOM_RIGHT 等）
 * 4. 多色渐变文本（3色、4色）
 * 5. 渐变 + 不同字号
 * 6. 渐变 RichText 多 Span
 * 7. 渐变 + 粗体/大字号
 */
@Page("KRGradientRichTextTestPage")
internal class KRGradientRichTextTestPage : Pager() {
    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: 水平渐变文本 ===
                Text {
                    attr {
                        text("1. 水平渐变文本")
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
                    Text {
                        attr {
                            text("水平渐变效果 Horizontal Gradient")
                            fontSize(24f)
                            fontWeightBold()
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFFFF6B6B), 0f),
                                ColorStop(Color(0xFF4ECDC4), 1f)
                            )
                        }
                    }
                }

                // === Section 2: 垂直渐变文本 ===
                Text {
                    attr {
                        text("2. 垂直渐变文本")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    Text {
                        attr {
                            text("垂直渐变效果 Vertical Gradient")
                            fontSize(24f)
                            fontWeightBold()
                            backgroundLinearGradient(
                                Direction.TO_BOTTOM,
                                ColorStop(Color(0xFF667EEA), 0f),
                                ColorStop(Color(0xFF764BA2), 1f)
                            )
                        }
                    }
                }

                // === Section 3: 对角渐变文本 ===
                Text {
                    attr {
                        text("3. 对角渐变文本")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    // 右下方向
                    Text {
                        attr {
                            text("对角渐变 TO_BOTTOM_RIGHT")
                            fontSize(20f)
                            fontWeightBold()
                            backgroundLinearGradient(
                                Direction.TO_BOTTOM_RIGHT,
                                ColorStop(Color(0xFFF093FB), 0f),
                                ColorStop(Color(0xFFF5576C), 1f)
                            )
                        }
                    }
                    // 左下方向
                    Text {
                        attr {
                            text("对角渐变 TO_BOTTOM_LEFT")
                            fontSize(20f)
                            fontWeightBold()
                            marginTop(8f)
                            backgroundLinearGradient(
                                Direction.TO_BOTTOM_LEFT,
                                ColorStop(Color(0xFF43E97B), 0f),
                                ColorStop(Color(0xFF38F9D7), 1f)
                            )
                        }
                    }
                }

                // === Section 4: 多色渐变文本 ===
                Text {
                    attr {
                        text("4. 多色渐变文本")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    // 3色渐变
                    Text {
                        attr {
                            text("三色彩虹渐变效果 Rainbow")
                            fontSize(22f)
                            fontWeightBold()
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFFFF0000), 0f),
                                ColorStop(Color(0xFF00FF00), 0.5f),
                                ColorStop(Color(0xFF0000FF), 1f)
                            )
                        }
                    }
                    // 4色渐变
                    Text {
                        attr {
                            text("四色渐变效果 Multicolor")
                            fontSize(22f)
                            fontWeightBold()
                            marginTop(8f)
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFFFF6B6B), 0f),
                                ColorStop(Color(0xFFFECA57), 0.33f),
                                ColorStop(Color(0xFF48DBFB), 0.66f),
                                ColorStop(Color(0xFFFF9FF3), 1f)
                            )
                        }
                    }
                }

                // === Section 5: 渐变 + 不同字号 ===
                Text {
                    attr {
                        text("5. 渐变+不同字号")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    Text {
                        attr {
                            text("小字号渐变 12")
                            fontSize(12f)
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFFE91E63), 0f),
                                ColorStop(Color(0xFF2196F3), 1f)
                            )
                        }
                    }
                    Text {
                        attr {
                            text("中字号渐变 18")
                            fontSize(18f)
                            marginTop(4f)
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFFE91E63), 0f),
                                ColorStop(Color(0xFF2196F3), 1f)
                            )
                        }
                    }
                    Text {
                        attr {
                            text("大字号渐变 28")
                            fontSize(28f)
                            marginTop(4f)
                            fontWeightBold()
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFFE91E63), 0f),
                                ColorStop(Color(0xFF2196F3), 1f)
                            )
                        }
                    }
                }

                // === Section 6: 渐变 RichText 多 Span ===
                Text {
                    attr {
                        text("6. 渐变RichText")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
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
                            fontSize(20f)
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFFFF6B6B), 0f),
                                ColorStop(Color(0xFF4ECDC4), 0.5f),
                                ColorStop(Color(0xFF45B7D1), 1f)
                            )
                        }
                        Span {
                            text("渐变富文本")
                        }
                        Span {
                            fontWeightBold()
                            text("粗体部分")
                        }
                        Span {
                            fontSize(24f)
                            text("大号字")
                        }
                    }
                }

                // === Section 7: 渐变 + 粗体大字号 ===
                Text {
                    attr {
                        text("7. 渐变大标题")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 16f)
                        backgroundColor(0xFF1A1A2E)
                        margin(left = 16f, right = 16f, top = 8f)
                        borderRadius(12f)
                    }
                    Text {
                        attr {
                            text("KuiklyUI")
                            fontSize(36f)
                            fontWeightBold()
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFFFFD700), 0f),
                                ColorStop(Color(0xFFFF6B6B), 0.5f),
                                ColorStop(Color(0xFFFF1493), 1f)
                            )
                        }
                    }
                    Text {
                        attr {
                            text("Web Render Engine")
                            fontSize(18f)
                            marginTop(4f)
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFF00D2FF), 0f),
                                ColorStop(Color(0xFF3A7BD5), 1f)
                            )
                        }
                    }
                }

                // 底部间距
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }
}
