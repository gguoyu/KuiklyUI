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
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.ActionSheet
import com.tencent.kuikly.core.views.AlertDialog
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Modal
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * Modal interaction test page
 *
 * Tests covered:
 * 1. AlertDialog — standard dialog (title + message + buttons)
 * 2. ActionSheet — bottom action sheet
 * 3. Custom Modal — full-screen custom modal
 * 4. Result panel — state changes after modal interactions
 */
@Page("ModalTestPage")
internal class ModalTestPage : Pager() {

    private var showAlert by observable(false)
    private var showActionSheet by observable(false)
    private var showCustomModal by observable(false)
    private var alertResult by observable("none")
    private var actionSheetResult by observable("none")
    private var customModalResult by observable("none")
    private var nestedModalResult by observable("none")

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

                // === Section 1: AlertDialog ===
                Text {
                    attr {
                        text("1. AlertDialog")
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
                        backgroundColor(0xFF2196F3)
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.showAlert = true
                        }
                    }
                    Text {
                        attr {
                            text("show-alert")
                            fontSize(16f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                Text {
                    attr {
                        text("alert-result: ${ctx.alertResult}")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // === Section 2: ActionSheet ===
                Text {
                    attr {
                        text("2. ActionSheet")
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
                        backgroundColor(0xFF4CAF50)
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.showActionSheet = true
                        }
                    }
                    Text {
                        attr {
                            text("show-action-sheet")
                            fontSize(16f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                Text {
                    attr {
                        text("action-sheet-result: ${ctx.actionSheetResult}")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // === Section 3: Custom Modal ===
                Text {
                    attr {
                        text("3. Custom Modal")
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
                        backgroundColor(0xFFFF9800)
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.showCustomModal = true
                        }
                    }
                    Text {
                        attr {
                            text("show-custom-modal")
                            fontSize(16f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                Text {
                    attr {
                        text("custom-modal-result: ${ctx.customModalResult}")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // === Section 4: Result Summary ===
                Text {
                    attr {
                        text("4. Result Summary")
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
                        padding(all = 16f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }

                    Text {
                        attr {
                            text("Alert: ${ctx.alertResult}\n" +
                                 "ActionSheet: ${ctx.actionSheetResult}\n" +
                                 "CustomModal: ${ctx.customModalResult}")
                            fontSize(14f)
                            color(Color.BLACK)
                        }
                    }
                }

                View {
                    attr {
                        height(50f)
                    }
                }
            }

            // AlertDialog
            AlertDialog {
                attr {
                    showAlert(ctx.showAlert)
                    title("confirm-action")
                    message("This is a test Alert dialog.")
                    actionButtons("cancel", "ok")
                }
                event {
                    clickActionButton { buttonIndex ->
                        ctx.showAlert = false
                        ctx.alertResult = if (buttonIndex == 0) "cancelled" else "confirmed"
                    }
                }
            }

            // ActionSheet
            ActionSheet {
                attr {
                    showActionSheet(ctx.showActionSheet)
                    descriptionOfActions("select-an-action")
                    actionButtons("cancel", "take-photo", "from-album", "from-file")
                }
                event {
                    clickActionButton { buttonIndex ->
                        ctx.showActionSheet = false
                        val actions = listOf("cancel", "take-photo", "from-album", "from-file")
                        ctx.actionSheetResult = "selected: ${actions[buttonIndex]}"
                    }
                }
            }

            // Custom Modal
            if (ctx.showCustomModal) {
                Modal {
                    View {
                        attr {
                            absolutePosition(left = 0f, top = 0f, right = 0f, bottom = 0f)
                            backgroundColor(0x88000000)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.showCustomModal = false
                                ctx.customModalResult = "bg-dismissed"
                            }
                        }

                        View {
                            attr {
                                size(280f, 200f)
                                backgroundColor(Color.WHITE)
                                borderRadius(12f)
                                allCenter()
                            }
                            event {
                                click {
                                    // stop propagation to background
                                }
                            }

                            Text {
                                attr {
                                    text("custom-modal")
                                    fontSize(18f)
                                    fontWeightBold()
                                    color(Color.BLACK)
                                    marginBottom(16f)
                                }
                            }

                            Text {
                                attr {
                                    text("custom modal content")
                                    fontSize(14f)
                                    color(0xFF666666)
                                    marginBottom(24f)
                                    textAlignCenter()
                                }
                            }

                            View {
                                attr {
                                    width(120f)
                                    height(36f)
                                    backgroundColor(0xFF2196F3)
                                    borderRadius(18f)
                                    allCenter()
                                }
                                event {
                                    click {
                                        ctx.showCustomModal = false
                                        ctx.customModalResult = "confirmed"
                                    }
                                }
                                Text {
                                    attr {
                                        text("confirm")
                                        fontSize(14f)
                                        color(Color.WHITE)
                                        fontWeightBold()
                                    }
                                }
                            }

                            // Nested modal trigger — exercises KRModalView.isInsideModalView
                            View {
                                attr {
                                    width(140f)
                                    height(36f)
                                    marginTop(8f)
                                    backgroundColor(Color(0xFFFF9800))
                                    borderRadius(18f)
                                    allCenter()
                                }
                                event {
                                    click {
                                        ctx.showActionSheet = true
                                    }
                                }
                                Text {
                                    attr {
                                        text("nested-modal")
                                        fontSize(14f)
                                        color(Color.WHITE)
                                        fontWeightBold()
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
