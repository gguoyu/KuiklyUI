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

package com.tencent.kuikly.demo.pages.web_test.interactions

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Border
import com.tencent.kuikly.core.base.BorderStyle
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.Input
import com.tencent.kuikly.core.views.LengthLimitType
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.TextArea
import com.tencent.kuikly.core.views.View

/**
 * maxTextLength 验证测试页面
 *
 * 测试覆盖：
 * 1. 默认 maxlength
 * 2. BYTE / CHARACTER / VISUAL_WIDTH 三种限制类型
 * 3. Input 与 TextArea 的 maxlength 属性与截断行为
 */
@Page("MaxLengthTestPage")
internal class MaxLengthTestPage : Pager() {

    private var byteInputLength by observable(0)
    private var characterInputLength by observable(0)
    private var visualWidthInputLength by observable(0)
    private var byteTextAreaLength by observable(0)
    private var characterTextAreaLength by observable(0)
    private var visualWidthTextAreaLength by observable(0)

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

                Text {
                    attr {
                        text("MaxLengthTestPage")
                        fontSize(20f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                Text {
                    attr {
                        text("Input 示例")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        padding(16f)
                    }
                    Text {
                        attr {
                            fontSize(14f)
                            fontWeightBold()
                            text("0. 未指定限制类型 maxTextLength(10)")
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(50f)
                            fontSize(16f)
                            margin(10f)
                            borderRadius(4f)
                            border(Border(1f, BorderStyle.SOLID, Color.GRAY))
                            placeholder("请输入文本")
                            maxTextLength(10)
                        }
                    }
                }

                View {
                    attr {
                        padding(16f)
                    }
                    Text {
                        attr {
                            fontSize(14f)
                            fontWeightBold()
                            text("1. BYTE 类型限制")
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(50f)
                            fontSize(16f)
                            margin(10f)
                            borderRadius(4f)
                            border(Border(1f, BorderStyle.SOLID, Color.GRAY))
                            placeholder("请输入文本（按字节限制）")
                            maxTextLength(10, LengthLimitType.BYTE)
                        }
                        event {
                            textDidChange {
                                ctx.byteInputLength = it.length ?: -1
                            }
                        }
                    }
                    Text {
                        attr {
                            fontSize(12f)
                            color(Color(0xFF333333))
                            text("字节数: ${ctx.byteInputLength}/10")
                        }
                    }
                }

                View {
                    attr {
                        padding(16f)
                    }
                    Text {
                        attr {
                            fontSize(14f)
                            fontWeightBold()
                            text("2. CHARACTER 类型限制")
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(50f)
                            fontSize(16f)
                            margin(10f)
                            borderRadius(4f)
                            border(Border(1f, BorderStyle.SOLID, Color.GRAY))
                            placeholder("请输入文本（按字符限制）")
                            maxTextLength(10, LengthLimitType.CHARACTER)
                        }
                        event {
                            textDidChange {
                                ctx.characterInputLength = it.length ?: -1
                            }
                        }
                    }
                    Text {
                        attr {
                            fontSize(12f)
                            color(Color(0xFF333333))
                            text("字符数: ${ctx.characterInputLength}/10")
                        }
                    }
                }

                View {
                    attr {
                        padding(16f)
                    }
                    Text {
                        attr {
                            fontSize(14f)
                            fontWeightBold()
                            text("3. VISUAL_WIDTH 类型限制")
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(50f)
                            fontSize(16f)
                            margin(10f)
                            borderRadius(4f)
                            border(Border(1f, BorderStyle.SOLID, Color.GRAY))
                            placeholder("请输入文本（按视觉宽度限制）")
                            maxTextLength(10, LengthLimitType.VISUAL_WIDTH)
                        }
                        event {
                            textDidChange {
                                ctx.visualWidthInputLength = it.length ?: -1
                            }
                        }
                    }
                    Text {
                        attr {
                            fontSize(12f)
                            color(Color(0xFF333333))
                            text("视觉宽度: ${ctx.visualWidthInputLength}/10")
                        }
                    }
                }

                Text {
                    attr {
                        text("TextArea 示例")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        padding(16f)
                    }
                    Text {
                        attr {
                            fontSize(14f)
                            fontWeightBold()
                            text("0. 未指定限制类型 maxTextLength(20)")
                            marginBottom(10f)
                        }
                    }
                    TextArea {
                        attr {
                            flex(1f)
                            height(100f)
                            fontSize(16f)
                            margin(10f)
                            borderRadius(4f)
                            border(Border(1f, BorderStyle.SOLID, Color.GRAY))
                            placeholder("请输入多行文本")
                            maxTextLength(20)
                        }
                    }
                }

                View {
                    attr {
                        padding(16f)
                    }
                    Text {
                        attr {
                            fontSize(14f)
                            fontWeightBold()
                            text("1. BYTE 类型限制")
                            marginBottom(10f)
                        }
                    }
                    TextArea {
                        attr {
                            flex(1f)
                            height(100f)
                            fontSize(16f)
                            margin(10f)
                            borderRadius(4f)
                            border(Border(1f, BorderStyle.SOLID, Color.GRAY))
                            placeholder("请输入多行文本（按字节限制）")
                            maxTextLength(20, LengthLimitType.BYTE)
                        }
                        event {
                            textDidChange {
                                ctx.byteTextAreaLength = it.length ?: -1
                            }
                        }
                    }
                    Text {
                        attr {
                            fontSize(12f)
                            color(Color(0xFF333333))
                            marginTop(8f)
                            text("字节数: ${ctx.byteTextAreaLength}/20")
                        }
                    }
                }

                View {
                    attr {
                        padding(16f)
                    }
                    Text {
                        attr {
                            fontSize(14f)
                            fontWeightBold()
                            text("2. CHARACTER 类型限制")
                            marginBottom(10f)
                        }
                    }
                    TextArea {
                        attr {
                            flex(1f)
                            height(100f)
                            fontSize(16f)
                            margin(10f)
                            borderRadius(4f)
                            border(Border(1f, BorderStyle.SOLID, Color.GRAY))
                            placeholder("请输入多行文本（按字符限制）")
                            maxTextLength(20, LengthLimitType.CHARACTER)
                        }
                        event {
                            textDidChange {
                                ctx.characterTextAreaLength = it.length ?: -1
                            }
                        }
                    }
                    Text {
                        attr {
                            fontSize(12f)
                            color(Color(0xFF333333))
                            marginTop(8f)
                            text("字符数: ${ctx.characterTextAreaLength}/20")
                        }
                    }
                }

                View {
                    attr {
                        padding(16f)
                    }
                    Text {
                        attr {
                            fontSize(14f)
                            fontWeightBold()
                            text("3. VISUAL_WIDTH 类型限制")
                            marginBottom(10f)
                        }
                    }
                    TextArea {
                        attr {
                            flex(1f)
                            height(100f)
                            fontSize(16f)
                            margin(10f)
                            borderRadius(4f)
                            border(Border(1f, BorderStyle.SOLID, Color.GRAY))
                            placeholder("请输入多行文本（按视觉宽度限制）")
                            maxTextLength(20, LengthLimitType.VISUAL_WIDTH)
                        }
                        event {
                            textDidChange {
                                ctx.visualWidthTextAreaLength = it.length ?: -1
                            }
                        }
                    }
                    Text {
                        attr {
                            fontSize(12f)
                            color(Color(0xFF333333))
                            marginTop(8f)
                            text("视觉宽度: ${ctx.visualWidthTextAreaLength}/20")
                        }
                    }
                }

                View {
                    attr {
                        height(48f)
                    }
                }
            }
        }
    }
}
