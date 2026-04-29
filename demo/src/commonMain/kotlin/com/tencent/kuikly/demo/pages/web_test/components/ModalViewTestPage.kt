package com.tencent.kuikly.demo.pages.web_test.components

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Modal
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.core.views.compose.Button

/**
 * ModalView test page
 *
 * Targets uncovered KRModalView (h5 layer):
 * 1. Modal with inWindow=false (default)
 * 2. Modal show/dismiss lifecycle
 * 3. Nested Modal (inner modal stays inside outer)
 */
@Page("ModalViewTestPage")
internal class ModalViewTestPage : Pager() {
    private var showModal by observable(false)
    private var showNestedModal by observable(false)
    private var dismissCount by observable(0)

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
                        text("ModalViewTestPage")
                        fontSize(20f)
                        color(Color.BLACK)
                        marginLeft(16f)
                        marginTop(16f)
                    }
                }

                // === Section 1: Show/Dismiss Modal ===
                Button {
                    attr {
                        titleAttr { text(if (ctx.showModal) "Hide Modal" else "Show Modal") }
                        size(width = 280f, height = 56f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(if (ctx.showModal) 0xFFE53935 else 0xFF1976D2)
                    }
                    event {
                        click {
                            ctx.showModal = !ctx.showModal
                        }
                    }
                }

                Text {
                    attr {
                        text("dismiss-count: ${ctx.dismissCount}")
                        fontSize(14f)
                        color(0xFF666666)
                        marginLeft(16f)
                        marginTop(8f)
                    }
                }

                // === Section 2: Nested Modal ===
                Button {
                    attr {
                        titleAttr { text(if (ctx.showNestedModal) "Hide Nested Modal" else "Show Nested Modal") }
                        size(width = 280f, height = 56f)
                        margin(left = 16f, top = 12f)
                        backgroundColor(if (ctx.showNestedModal) 0xFFE53935 else 0xFF4CAF50)
                    }
                    event {
                        click {
                            ctx.showNestedModal = !ctx.showNestedModal
                        }
                    }
                }

                View { attr { height(50f) } }
            }

            // Modal overlay
            if (ctx.showModal) {
                Modal(inWindow = true) {
                    attr {
                        allCenter()
                    }
                    View {
                        attr {
                            size(300f, 250f)
                            backgroundColor(Color.WHITE)
                            borderRadius(16f)
                            padding(all = 20f)
                        }

                        Text {
                            attr {
                                text("Modal Content")
                                fontSize(20f)
                                fontWeightBold()
                                color(Color.BLACK)
                            }
                        }

                        Text {
                            attr {
                                text("This is a modal overlay")
                                fontSize(14f)
                                color(0xFF666666)
                                marginTop(8f)
                            }
                        }

                        // Nested modal button inside the modal
                        Button {
                            attr {
                                titleAttr { text(if (ctx.showNestedModal) "Hide Inner" else "Show Inner Modal") }
                                size(width = 200f, height = 44f)
                                margin(top = 16f)
                                backgroundColor(0xFF4CAF50)
                            }
                            event {
                                click {
                                    ctx.showNestedModal = !ctx.showNestedModal
                                }
                            }
                        }

                        Button {
                            attr {
                                titleAttr { text("Dismiss") }
                                size(width = 200f, height = 44f)
                                margin(top = 8f)
                                backgroundColor(0xFFE53935)
                            }
                            event {
                                click {
                                    ctx.showModal = false
                                    ctx.dismissCount = ctx.dismissCount + 1
                                }
                            }
                        }

                        // Nested modal inside modal
                        if (ctx.showNestedModal) {
                            Modal {
                                attr {
                                    allCenter()
                                }
                                View {
                                    attr {
                                        size(200f, 120f)
                                        backgroundColor(Color(0xFFFFF3E0))
                                        borderRadius(12f)
                                        padding(all = 16f)
                                    }
                                    Text {
                                        attr {
                                            text("Nested Modal")
                                            fontSize(16f)
                                            fontWeightBold()
                                            color(Color(0xFFE65100))
                                        }
                                    }
                                    Button {
                                        attr {
                                            titleAttr { text("Close Inner") }
                                            size(width = 140f, height = 36f)
                                            margin(top = 8f)
                                            backgroundColor(0xFFFF9800)
                                        }
                                        event {
                                            click {
                                                ctx.showNestedModal = false
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
    }
}
