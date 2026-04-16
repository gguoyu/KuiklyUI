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

                View {
                    attr {
                        height(40f)
                    }
                }
            }
        }
    }
}
