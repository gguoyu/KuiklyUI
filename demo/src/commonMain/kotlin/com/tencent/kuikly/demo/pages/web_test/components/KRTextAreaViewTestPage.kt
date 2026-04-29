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
import com.tencent.kuikly.core.base.ViewRef
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.TextArea
import com.tencent.kuikly.core.views.TextAreaView
import com.tencent.kuikly.core.views.View

/**
 * KRTextAreaView (TextArea) test page
 *
 * Tests covered:
 * 1. Basic multiline input — renders placeholder and accepts text
 * 2. Max length constraint — limits input to specified character count
 * 3. Read-only mode — disables editing when set
 * 4. Font size and color — style props applied to textarea text
 * 5. Clear counter — state-driven clear action
 */
@Page("KRTextAreaViewTestPage")
internal class KRTextAreaViewTestPage : Pager() {

    private var areaValue by observable("")
    private var clearedCount by observable(0)
    private var readOnly by observable(false)
    private var setTextCount by observable(0)
    private var focusState by observable("none")
    private var cursorIndex by observable(-1)
    private var beyondLimitCount by observable(0)
    private var textAreaRef: ViewRef<TextAreaView>? = null
    private var limitedAreaRef: ViewRef<TextAreaView>? = null

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr { flex(1f) }

                // === Section 1: Basic TextArea ===
                Text {
                    attr {
                        text("1. Basic TextArea")
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
                        height(100f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                        padding(all = 12f)
                    }
                    TextArea {
                        ref {
                            ctx.textAreaRef = it
                        }
                        attr {
                            flex(1f)
                            fontSize(15f)
                            color(Color.BLACK)
                            text("initial-content")
                            placeholder("enter multiline text here")
                            placeholderColor(Color(0xFF999999))
                        }
                        event {
                            textDidChange { params ->
                                ctx.areaValue = params.text
                            }
                            inputFocus {
                                ctx.focusState = "focused"
                            }
                            inputBlur {
                                ctx.focusState = "blurred"
                            }
                            inputReturn { }
                        }
                    }
                }

                Text {
                    attr {
                        text("area-value-length: ${ctx.areaValue.length}")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // Button that uses ViewRef setText — exercises KRTextAreaView.call(SET_TEXT)
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(Color(0xFF43A047))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.setTextCount += 1
                            ctx.textAreaRef?.view?.setText("preset-text-${ctx.setTextCount}")
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.setTextCount == 0) "textarea-set-text-idle" else "textarea-set-text: ${ctx.setTextCount}")
                            fontSize(13f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // === Section 2: Max Length ===
                Text {
                    attr {
                        text("2. Max Length (20 chars)")
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
                        height(80f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                        padding(all = 12f)
                    }
                    TextArea {
                        attr {
                            flex(1f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("max 20 chars")
                            maxTextLength(20)
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
                        height(80f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                        padding(all = 12f)
                    }
                    TextArea {
                        attr {
                            flex(1f)
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
                            text(if (ctx.readOnly) "textarea-readonly-active" else "textarea-readonly-inactive")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // === Section 4: Styled TextArea ===
                Text {
                    attr {
                        text("4. Styled TextArea")
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
                        height(80f)
                        backgroundColor(0xFFE3F2FD)
                        borderRadius(8f)
                        padding(all = 12f)
                    }
                    TextArea {
                        attr {
                            flex(1f)
                            fontSize(16f)
                            color(Color(0xFF1565C0))
                            fontWeightBold()
                            placeholder("styled textarea")
                            placeholderColor(Color(0xFF90CAF9))
                        }
                    }
                }

                // === Section 5: Clear Counter ===
                Text {
                    attr {
                        text("5. Clear Counter")
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
                            text(if (ctx.clearedCount == 0) "textarea-clear-idle" else "textarea-cleared: ${ctx.clearedCount}")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                View { attr { height(50f) } }

                // === Section 6: Styling & Keyboard ===
                Text {
                    attr {
                        text("6. Styling & Keyboard")
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
                        height(60f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                        padding(all = 8f)
                    }
                    TextArea {
                        attr {
                            flex(1f)
                            fontSize(14f)
                            color(Color.BLACK)
                            placeholder("center-aligned-area")
                            placeholderColor(Color(0xFF9E9E9E))
                            textAlignCenter()
                            tintColor(Color(0xFF1976D2))
                            returnKeyTypeSearch()
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(60f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                        padding(all = 8f)
                    }
                    TextArea {
                        attr {
                            flex(1f)
                            fontSize(14f)
                            color(Color.BLACK)
                            placeholder("bold-weight-area")
                            fontWeightBold()
                            returnKeyTypeDone()
                        }
                    }
                }

                // === Section 7: Focus / Blur / Cursor ===
                Text {
                    attr {
                        text("7. Focus / Blur / Cursor")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                Text {
                    attr {
                        text("focus-state:${ctx.focusState}")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                Text {
                    attr {
                        text("cursor-index:${ctx.cursorIndex}")
                        fontSize(13f)
                        marginTop(4f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // Focus button — exercises KRTextAreaView.call(FOCUS)
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(Color(0xFF1976D2))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.textAreaRef?.view?.focus()
                        }
                    }
                    Text {
                        attr {
                            text("textarea-focus")
                            fontSize(13f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // Blur button — exercises KRTextAreaView.call(BLUR)
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(Color(0xFF7B1FA2))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.textAreaRef?.view?.blur()
                        }
                    }
                    Text {
                        attr {
                            text("textarea-blur")
                            fontSize(13f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // GetCursorIndex button — exercises KRTextAreaView.call(GET_CURSOR_INDEX)
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(Color(0xFF00897B))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.textAreaRef?.view?.cursorIndex { index ->
                                ctx.cursorIndex = index
                            }
                        }
                    }
                    Text {
                        attr {
                            text("textarea-get-cursor")
                            fontSize(13f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // SetCursorIndex button — exercises KRTextAreaView.call(SET_CURSOR_INDEX)
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(Color(0xFFEF6C00))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.textAreaRef?.view?.setCursorIndex(0)
                        }
                    }
                    Text {
                        attr {
                            text("textarea-set-cursor-0")
                            fontSize(13f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // === Section 8: TextLengthBeyondLimit ===
                Text {
                    attr {
                        text("8. Text Length Limit Callback")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                Text {
                    attr {
                        text("beyond-limit-count:${ctx.beyondLimitCount}")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(60f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                        padding(all = 8f)
                    }
                    TextArea {
                        ref {
                            ctx.limitedAreaRef = it
                        }
                        attr {
                            flex(1f)
                            fontSize(14f)
                            color(Color.BLACK)
                            placeholder("max 5 chars")
                            maxTextLength(5)
                        }
                        event {
                            textLengthBeyondLimit {
                                ctx.beyondLimitCount += 1
                            }
                        }
                    }
                }

                View { attr { height(50f) } }
            }
        }
    }
}
