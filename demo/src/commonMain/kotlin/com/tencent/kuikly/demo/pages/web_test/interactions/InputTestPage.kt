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
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.TextArea
import com.tencent.kuikly.core.views.View

/**
 * 输入框交互验证测试页面
 *
 * 测试覆盖：
 * 1. 单行文本输入 — 基础输入框
 * 2. 密码输入 — 密码键盘模式
 * 3. 数字输入 — 数字键盘模式
 * 4. 多行文本输入 — TextArea 多行输入
 * 5. 最大长度限制 — maxTextLength 验证
 */
@Page("InputTestPage")
internal class InputTestPage : Pager() {

    // === 响应式状态 ===
    private var textValue by observable("")
    private var passwordValue by observable("")
    private var numberValue by observable("")
    private var multilineValue by observable("")
    private var limitedValue by observable("")

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

                // === Section 1: 单行文本输入 ===
                Text {
                    attr {
                        text("1. 单行文本输入")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        border(Border(1f, BorderStyle.SOLID, Color(0xFFDDDDDD)))
                        borderRadius(8f)
                        padding(left = 12f, right = 12f)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(42f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("请输入文本")
                            placeholderColor(Color(0xFF999999))
                        }
                        event {
                            textDidChange { params ->
                                ctx.textValue = params.text
                            }
                        }
                    }
                }

                // 输入回显
                Text {
                    attr {
                        text("输入内容: ${ctx.textValue}")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // === Section 2: 密码输入 ===
                Text {
                    attr {
                        text("2. 密码输入")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        border(Border(1f, BorderStyle.SOLID, Color(0xFFDDDDDD)))
                        borderRadius(8f)
                        padding(left = 12f, right = 12f)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(42f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("请输入密码")
                            placeholderColor(Color(0xFF999999))
                            keyboardTypePassword()
                        }
                        event {
                            textDidChange { params ->
                                ctx.passwordValue = params.text
                            }
                        }
                    }
                }

                // 密码长度回显
                Text {
                    attr {
                        text("已输入 ${ctx.passwordValue.length} 个字符")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // === Section 3: 数字输入 ===
                Text {
                    attr {
                        text("3. 数字输入")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        border(Border(1f, BorderStyle.SOLID, Color(0xFFDDDDDD)))
                        borderRadius(8f)
                        padding(left = 12f, right = 12f)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(42f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("请输入数字")
                            placeholderColor(Color(0xFF999999))
                            keyboardTypeNumber()
                        }
                        event {
                            textDidChange { params ->
                                ctx.numberValue = params.text
                            }
                        }
                    }
                }

                // 数字回显
                Text {
                    attr {
                        text("数字内容: ${ctx.numberValue}")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // === Section 4: 多行文本输入 ===
                Text {
                    attr {
                        text("4. 多行文本输入")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(120f)
                        border(Border(1f, BorderStyle.SOLID, Color(0xFFDDDDDD)))
                        borderRadius(8f)
                        padding(all = 12f)
                    }
                    TextArea {
                        attr {
                            flex(1f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("请输入多行文本...")
                            placeholderColor(Color(0xFF999999))
                        }
                        event {
                            textDidChange { params ->
                                ctx.multilineValue = params.text
                            }
                        }
                    }
                }

                // 多行内容回显
                Text {
                    attr {
                        text("多行内容: ${ctx.multilineValue}")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        marginRight(16f)
                        color(0xFF666666)
                    }
                }

                // === Section 5: 最大长度限制 ===
                Text {
                    attr {
                        text("5. 最大长度限制 (10字)")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        border(Border(1f, BorderStyle.SOLID, Color(0xFFDDDDDD)))
                        borderRadius(8f)
                        padding(left = 12f, right = 12f)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(42f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("最多输入10个字")
                            placeholderColor(Color(0xFF999999))
                            maxTextLength(10)
                        }
                        event {
                            textDidChange { params ->
                                ctx.limitedValue = params.text
                            }
                        }
                    }
                }

                // 字数计数
                Text {
                    attr {
                        text("${ctx.limitedValue.length}/10")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(
                            if (ctx.limitedValue.length >= 10) Color(0xFFFF5722)
                            else Color(0xFF666666)
                        )
                    }
                }

                // 底部间距
                View {
                    attr {
                        height(100f)
                    }
                }
            }
        }
    }
}
