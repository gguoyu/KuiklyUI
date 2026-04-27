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
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.Input
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * KRTextFieldView (Input) test page
 *
 * Tests covered:
 * 1. Basic text input — renders placeholder and accepts text
 * 2. Max length constraint — limits input to specified character count
 * 3. Read-only mode — disables editing when set
 * 4. Font size and color — style props applied to input text
 * 5. Clear button — state-driven clear action
 */
@Page("KRTextFieldViewTestPage")
internal class KRTextFieldViewTestPage : Pager() {

    private var inputValue by observable("")
    private var clearedCount by observable(0)
    private var readOnly by observable(false)

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr { flex(1f) }

                // === Section 1: Basic Input ===
                Text {
                    attr {
                        text("1. Basic Input")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(44f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                        padding(left = 12f, right = 12f)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(42f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("enter text here")
                            placeholderColor(Color(0xFF999999))
                        }
                        event {
                            textDidChange { params ->
                                ctx.inputValue = params.text
                            }
                            inputFocus { }
                            inputBlur { }
                            inputReturn { }
                        }
                    }
                }

                Text {
                    attr {
                        text("input-value: ${ctx.inputValue}")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // === Section 2: Max Length ===
                Text {
                    attr {
                        text("2. Max Length (5 chars)")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(44f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                        padding(left = 12f, right = 12f)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(42f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("max 5 chars")
                            maxTextLength(5)
                        }
                    }
                }

                // === Section 3: Read-only Toggle ===
                Text {
                    attr {
                        text("3. Read-only Toggle")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(44f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                        padding(left = 12f, right = 12f)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(42f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("read-only when locked")
                            if (ctx.readOnly) editable(false)
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(if (ctx.readOnly) Color(0xFFE53935) else Color(0xFF4CAF50))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.readOnly = !ctx.readOnly
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.readOnly) "readonly-active" else "readonly-inactive")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // === Section 4: Styled Input ===
                Text {
                    attr {
                        text("4. Styled Input")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(44f)
                        backgroundColor(0xFFE3F2FD)
                        borderRadius(8f)
                        padding(left = 12f, right = 12f)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(42f)
                            fontSize(18f)
                            color(Color(0xFF1565C0))
                            fontWeightBold()
                            placeholder("styled input")
                            placeholderColor(Color(0xFF90CAF9))
                        }
                    }
                }

                // === Section 5: Clear Action ===
                Text {
                    attr {
                        text("5. Clear Action")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(Color(0xFF2196F3))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.clearedCount += 1
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.clearedCount == 0) "clear-idle" else "clear-count: ${ctx.clearedCount}")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                View { attr { height(50f) } }

                // === Section 6: Keyboard Types ===
                Text {
                    attr {
                        text("6. Keyboard Types")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(44f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                        padding(left = 12f)
                        justifyContentCenter()
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(44f)
                            placeholder("password-input")
                            keyboardTypePassword()
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(44f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                        padding(left = 12f)
                        justifyContentCenter()
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(44f)
                            placeholder("number-input")
                            keyboardTypeNumber()
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(44f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                        padding(left = 12f)
                        justifyContentCenter()
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(44f)
                            placeholder("email-search-input")
                            keyboardTypeEmail()
                            returnKeyTypeSearch()
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(44f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                        padding(left = 12f)
                        justifyContentCenter()
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(44f)
                            placeholder("done-return-input")
                            returnKeyTypeDone()
                        }
                    }
                }

                View { attr { height(50f) } }
            }
        }
    }
}
