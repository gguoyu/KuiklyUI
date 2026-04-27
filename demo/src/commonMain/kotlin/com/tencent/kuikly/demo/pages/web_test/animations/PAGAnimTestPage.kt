package com.tencent.kuikly.demo.pages.web_test.animations

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.base.ViewRef
import com.tencent.kuikly.core.base.attr.ImageUri
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.PAG
import com.tencent.kuikly.core.views.PAGScaleMode
import com.tencent.kuikly.core.views.PAGView
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

@Page("PAGAnimTestPage")
internal class PAGAnimTestPage : Pager() {

    private var pagRef: ViewRef<PAGView>? = null
    private var playbackState by observable("running")
    private var progressMode by observable("auto")
    private var cancelCount by observable(0)
    private var repeatCount2 by observable(0)
    private var loadFailState by observable("load-fail: none")
    private var scaleModeLabel by observable("scale: letter_box")

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                    backgroundColor(Color.WHITE)
                }

                Text {
                    attr {
                        text("PAGAnimTestPage")
                        fontSize(22f)
                        fontWeightBold()
                        color(Color.BLACK)
                        marginTop(20f)
                        marginLeft(16f)
                    }
                }

                Text {
                    attr {
                        text("PAG status: " + ctx.playbackState)
                        fontSize(14f)
                        color(Color(0xFF333333))
                        marginTop(12f)
                        marginLeft(16f)
                    }
                }

                Text {
                    attr {
                        text("PAG progress mode: " + ctx.progressMode)
                        fontSize(14f)
                        color(Color(0xFF333333))
                        marginTop(6f)
                        marginLeft(16f)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 16f)
                        height(220f)
                        backgroundColor(Color(0xFFF5F7FA))
                        borderRadius(12f)
                        allCenter()
                    }

                    PAG {
                        ref {
                            ctx.pagRef = it
                        }
                        attr {
                            size(260f, 180f)
                            backgroundColor(Color(0xFFE5EAF3))
                            src(ImageUri.pageAssets("../PAGExamplePage/user_avatar.pag"))
                            replaceTextLayerContent("text_user_note", "Kuikly Web")
                            replaceImageLayerContent("img_user_avatar", ImageUri.pageAssets("../PAGExamplePage/user_portrait.png"))
                            autoPlay(true)
                            repeatCount(1)
                            scaleMode(PAGScaleMode.LETTER_BOX)
                        }

                        event {
                            animationStart {
                                ctx.playbackState = "running"
                                ctx.progressMode = "auto"
                            }

                            animationEnd {
                                ctx.playbackState = "ended"
                                ctx.progressMode = "manual-20%"
                                ctx.pagRef?.view?.setProgress(0.2f)
                            }

                            animationCancel {
                                ctx.cancelCount = ctx.cancelCount + 1
                            }

                            animationRepeat {
                                ctx.repeatCount2 = ctx.repeatCount2 + 1
                            }

                            loadFailure {
                                ctx.loadFailState = "load-fail: failed"
                            }
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 20f)
                        height(44f)
                        backgroundColor(Color(0xFF1E88E5))
                        borderRadius(10f)
                        allCenter()
                    }

                    event {
                        click {
                            ctx.progressMode = "auto"
                            ctx.playbackState = "running"
                            ctx.pagRef?.view?.play()
                        }
                    }

                    Text {
                        attr {
                            text("Play PAG")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        backgroundColor(Color(0xFFF57C00))
                        borderRadius(10f)
                        allCenter()
                    }

                    event {
                        click {
                            ctx.progressMode = "manual-20%"
                            ctx.playbackState = "paused"
                            ctx.pagRef?.view?.stop()
                            ctx.pagRef?.view?.setProgress(0.2f)
                        }
                    }

                    Text {
                        attr {
                            text("Pause at 20%")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                Text {
                    attr {
                        text("PAG asset: user_avatar.pag with text and image replacement")
                        fontSize(12f)
                        color(Color(0xFF666666))
                        margin(top = 16f, left = 16f, right = 16f)
                    }
                }

                // Status displays for new event callbacks
                Text {
                    attr {
                        text("cancel-count: ${ctx.cancelCount}")
                        fontSize(13f)
                        color(0xFF666666)
                        marginTop(8f)
                        marginLeft(16f)
                    }
                }
                Text {
                    attr {
                        text("repeat-count: ${ctx.repeatCount2}")
                        fontSize(13f)
                        color(0xFF666666)
                        marginTop(4f)
                        marginLeft(16f)
                    }
                }
                Text {
                    attr {
                        text(ctx.loadFailState)
                        fontSize(13f)
                        color(0xFF666666)
                        marginTop(4f)
                        marginLeft(16f)
                    }
                }

                // === Scale Mode Variants (scaleModeNone, scaleModeStretch, scaleModeZoom) ===
                Text {
                    attr {
                        text("Scale Modes")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // scaleModeNone — exercises SCALE_MODE prop with NONE value
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(100f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                        allCenter()
                    }
                    PAG {
                        attr {
                            size(120f, 80f)
                            src(ImageUri.pageAssets("../PAGExamplePage/user_avatar.pag"))
                            autoPlay(true)
                            repeatCount(-1)
                            scaleModeNone()
                        }
                    }
                }

                // scaleModeStretch — exercises SCALE_MODE prop with STRETCH value
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(100f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                        allCenter()
                    }
                    PAG {
                        attr {
                            size(200f, 80f)
                            src(ImageUri.pageAssets("../PAGExamplePage/user_avatar.pag"))
                            autoPlay(true)
                            repeatCount(-1)
                            scaleModeStretch()
                        }
                    }
                }

                // scaleModeZoom — exercises SCALE_MODE prop with ZOOM value
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(100f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                        allCenter()
                    }
                    PAG {
                        attr {
                            size(200f, 80f)
                            src(ImageUri.pageAssets("../PAGExamplePage/user_avatar.pag"))
                            autoPlay(true)
                            repeatCount(-1)
                            scaleModeZoom()
                        }
                    }
                }

                // Load failure test — exercises loadFailure event with a bad URL
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(60f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                        allCenter()
                    }
                    PAG {
                        attr {
                            size(100f, 50f)
                            src("assets://nonexistent_pag_file_that_will_fail.pag")
                            autoPlay(true)
                        }
                        event {
                            loadFailure {
                                ctx.loadFailState = "load-fail: failed"
                            }
                        }
                    }
                }

                Text {
                    attr {
                        text(ctx.scaleModeLabel)
                        fontSize(13f)
                        color(0xFF333333)
                        marginTop(8f)
                        marginLeft(16f)
                    }
                }

                View {
                    attr {
                        height(40f)
                    }
                }
            }
        }
    }
}
