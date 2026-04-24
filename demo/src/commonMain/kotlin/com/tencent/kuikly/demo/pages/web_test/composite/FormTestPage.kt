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

package com.tencent.kuikly.demo.pages.web_test.composite

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
import com.tencent.kuikly.core.views.View

/**
 * Composite scenario: Form
 *
 * Validates multi-component cooperation: multiple inputs + toggles + submit + validation
 *
 * Tests covered:
 * 1. Name input — required field validation
 * 2. Email input — format validation
 * 3. Phone input — numeric keyboard
 * 4. Note input — multiline text
 * 5. Subscribe toggle — boolean toggle
 * 6. Agree terms toggle — boolean toggle
 * 7. Submit button — validates all fields then shows result
 * 8. Reset button — clears all fields
 */
@Page("FormTestPage")
internal class FormTestPage : Pager() {

    private var nameValue by observable("")
    private var emailValue by observable("")
    private var phoneValue by observable("")
    private var noteValue by observable("")
    private var subscribeEnabled by observable(false)
    private var agreeTerms by observable(false)

    private var submitResult by observable("")
    private var hasSubmitted by observable(false)

    private var nameError by observable("")
    private var emailError by observable("")

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
                        text("User Info Form")
                        fontSize(20f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                Text {
                    attr {
                        text("Fields marked * are required")
                        fontSize(13f)
                        marginTop(4f)
                        marginLeft(16f)
                        color(0xFF999999)
                        marginBottom(8f)
                    }
                }

                View {
                    attr {
                        height(0.5f)
                        backgroundColor(0xFFEEEEEE)
                        marginBottom(16f)
                    }
                }

                // Name
                Text {
                    attr {
                        text("* Name")
                        fontSize(14f)
                        fontWeightBold()
                        marginLeft(16f)
                        marginBottom(6f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f)
                        height(44f)
                        border(
                            Border(
                                1f, BorderStyle.SOLID,
                                if (ctx.nameError.isNotEmpty()) Color(0xFFE53935) else Color(0xFFDDDDDD)
                            )
                        )
                        borderRadius(8f)
                        padding(left = 12f, right = 12f)
                        backgroundColor(Color.WHITE)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(42f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("enter name")
                            placeholderColor(Color(0xFF999999))
                        }
                        event {
                            textDidChange { params ->
                                ctx.nameValue = params.text
                                ctx.nameError = if (params.text.isBlank()) "name is required" else ""
                            }
                        }
                    }
                }

                if (ctx.nameError.isNotEmpty()) {
                    Text {
                        attr {
                            text(ctx.nameError)
                            fontSize(12f)
                            marginTop(4f)
                            marginLeft(16f)
                            color(Color(0xFFE53935))
                        }
                    }
                }

                // Email
                Text {
                    attr {
                        text("* Email")
                        fontSize(14f)
                        fontWeightBold()
                        marginLeft(16f)
                        marginTop(16f)
                        marginBottom(6f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f)
                        height(44f)
                        border(
                            Border(
                                1f, BorderStyle.SOLID,
                                if (ctx.emailError.isNotEmpty()) Color(0xFFE53935) else Color(0xFFDDDDDD)
                            )
                        )
                        borderRadius(8f)
                        padding(left = 12f, right = 12f)
                        backgroundColor(Color.WHITE)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(42f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("enter email")
                            placeholderColor(Color(0xFF999999))
                        }
                        event {
                            textDidChange { params ->
                                ctx.emailValue = params.text
                                ctx.emailError = when {
                                    params.text.isBlank() -> "email is required"
                                    !params.text.contains("@") -> "invalid email format"
                                    else -> ""
                                }
                            }
                        }
                    }
                }

                if (ctx.emailError.isNotEmpty()) {
                    Text {
                        attr {
                            text(ctx.emailError)
                            fontSize(12f)
                            marginTop(4f)
                            marginLeft(16f)
                            color(Color(0xFFE53935))
                        }
                    }
                }

                // Phone
                Text {
                    attr {
                        text("Phone")
                        fontSize(14f)
                        fontWeightBold()
                        marginLeft(16f)
                        marginTop(16f)
                        marginBottom(6f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f)
                        height(44f)
                        border(Border(1f, BorderStyle.SOLID, Color(0xFFDDDDDD)))
                        borderRadius(8f)
                        padding(left = 12f, right = 12f)
                        backgroundColor(Color.WHITE)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(42f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("enter phone (optional)")
                            placeholderColor(Color(0xFF999999))
                            keyboardTypeNumber()
                            maxTextLength(11)
                        }
                        event {
                            textDidChange { params ->
                                ctx.phoneValue = params.text
                            }
                        }
                    }
                }

                // Note
                Text {
                    attr {
                        text("Note")
                        fontSize(14f)
                        fontWeightBold()
                        marginLeft(16f)
                        marginTop(16f)
                        marginBottom(6f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f)
                        height(80f)
                        border(Border(1f, BorderStyle.SOLID, Color(0xFFDDDDDD)))
                        borderRadius(8f)
                        padding(left = 12f, right = 12f, top = 8f)
                        backgroundColor(Color.WHITE)
                    }
                    Input {
                        attr {
                            flex(1f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("note (optional)")
                            placeholderColor(Color(0xFF999999))
                            maxTextLength(200)
                        }
                        event {
                            textDidChange { params ->
                                ctx.noteValue = params.text
                            }
                        }
                    }
                }

                // Subscribe toggle
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        margin(left = 16f, right = 16f, top = 20f)
                        padding(all = 12f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("Subscribe to updates")
                            fontSize(14f)
                            flex(1f)
                            color(Color.BLACK)
                        }
                    }
                    View {
                        attr {
                            size(52f, 28f)
                            backgroundColor(
                                if (ctx.subscribeEnabled) Color(0xFF4CAF50) else Color(0xFFCCCCCC)
                            )
                            borderRadius(14f)
                        }
                        event {
                            click {
                                ctx.subscribeEnabled = !ctx.subscribeEnabled
                            }
                        }
                        View {
                            attr {
                                size(24f, 24f)
                                backgroundColor(Color.WHITE)
                                borderRadius(12f)
                                marginTop(2f)
                                marginLeft(if (ctx.subscribeEnabled) 26f else 2f)
                            }
                        }
                    }
                }

                // Agree terms toggle
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        margin(left = 16f, right = 16f, top = 12f)
                        padding(all = 12f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("I agree to the terms")
                            fontSize(14f)
                            flex(1f)
                            color(Color.BLACK)
                        }
                    }
                    View {
                        attr {
                            size(52f, 28f)
                            backgroundColor(
                                if (ctx.agreeTerms) Color(0xFF2196F3) else Color(0xFFCCCCCC)
                            )
                            borderRadius(14f)
                        }
                        event {
                            click {
                                ctx.agreeTerms = !ctx.agreeTerms
                            }
                        }
                        View {
                            attr {
                                size(24f, 24f)
                                backgroundColor(Color.WHITE)
                                borderRadius(12f)
                                marginTop(2f)
                                marginLeft(if (ctx.agreeTerms) 26f else 2f)
                            }
                        }
                    }
                }

                // Submit result
                if (ctx.hasSubmitted && ctx.submitResult.isNotEmpty()) {
                    View {
                        attr {
                            margin(left = 16f, right = 16f, top = 16f)
                            padding(all = 12f)
                            backgroundColor(0xFFE8F5E9)
                            borderRadius(8f)
                        }
                        Text {
                            attr {
                                text(ctx.submitResult)
                                fontSize(13f)
                                color(Color(0xFF2E7D32))
                            }
                        }
                    }
                }

                // Action buttons
                View {
                    attr {
                        flexDirectionRow()
                        margin(left = 16f, right = 16f, top = 24f)
                    }

                    View {
                        attr {
                            flex(1f)
                            height(48f)
                            backgroundColor(0xFFEEEEEE)
                            borderRadius(8f)
                            allCenter()
                            marginRight(8f)
                        }
                        event {
                            click {
                                ctx.nameValue = ""
                                ctx.emailValue = ""
                                ctx.phoneValue = ""
                                ctx.noteValue = ""
                                ctx.subscribeEnabled = false
                                ctx.agreeTerms = false
                                ctx.submitResult = ""
                                ctx.hasSubmitted = false
                                ctx.nameError = ""
                                ctx.emailError = ""
                            }
                        }
                        Text {
                            attr {
                                text("reset")
                                fontSize(16f)
                                color(0xFF666666)
                                fontWeightBold()
                            }
                        }
                    }

                    View {
                        attr {
                            flex(2f)
                            height(48f)
                            backgroundColor(
                                if (ctx.agreeTerms) Color(0xFF2196F3) else Color(0xFFBBBBBB)
                            )
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            click {
                                var valid = true
                                if (ctx.nameValue.isBlank()) {
                                    ctx.nameError = "name is required"
                                    valid = false
                                }
                                if (ctx.emailValue.isBlank()) {
                                    ctx.emailError = "email is required"
                                    valid = false
                                } else if (!ctx.emailValue.contains("@")) {
                                    ctx.emailError = "invalid email format"
                                    valid = false
                                }
                                if (!ctx.agreeTerms) {
                                    valid = false
                                }
                                if (valid) {
                                    ctx.submitResult = "submit ok: ${ctx.nameValue} / ${ctx.emailValue}"
                                    ctx.hasSubmitted = true
                                }
                            }
                        }
                        Text {
                            attr {
                                text("submit")
                                fontSize(16f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                }

                View {
                    attr {
                        height(60f)
                    }
                }
            }
        }
    }
}
