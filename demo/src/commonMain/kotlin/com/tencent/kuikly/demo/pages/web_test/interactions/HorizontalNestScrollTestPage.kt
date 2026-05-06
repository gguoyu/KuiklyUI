package com.tencent.kuikly.demo.pages.web_test.interactions

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.KRNestedScrollMode
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * Horizontal nested scroll test page.
 *
 * Coverage targets:
 * - H5NestScrollHelper ROW direction branches
 * - Horizontal nested scroll boundary detection
 * - canScrollLeft / canScrollRight checks
 */
@Page("HorizontalNestScrollTestPage")
internal class HorizontalNestScrollTestPage : Pager() {

    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            // Title
            View {
                attr {
                    height(50f)
                    backgroundColor(0xFF00695C)
                    allCenter()
                }
                Text {
                    attr {
                        text("Horizontal Nested Scroll")
                        fontSize(18f)
                        fontWeightBold()
                        color(Color.WHITE)
                    }
                }
            }

            // Section 1: Outer vertical list with inner horizontal list (PARENT_FIRST)
            Text {
                attr {
                    text("Section 1: Horizontal PARENT_FIRST")
                    fontSize(13f)
                    fontWeightBold()
                    color(0xFF00695C)
                    margin(left = 16f, top = 12f)
                }
            }

            List {
                attr {
                    height(120f)
                    flexDirectionRow()
                    backgroundColor(0xFFE0F2F1)
                    nestedScroll(KRNestedScrollMode.PARENT_FIRST, KRNestedScrollMode.SELF_ONLY)
                }
                for (i in 1..20) {
                    View {
                        attr {
                            size(width = 100f, height = 80f)
                            margin(left = 8f, top = 20f)
                            backgroundColor(if (i % 2 == 0) 0xFF26A69A else 0xFF4DB6AC)
                            borderRadius(8f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("H-Item $i")
                                fontSize(12f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                }
            }

            // Section 2: Horizontal list with SELF_FIRST
            Text {
                attr {
                    text("Section 2: Horizontal SELF_FIRST")
                    fontSize(13f)
                    fontWeightBold()
                    color(0xFF00695C)
                    margin(left = 16f, top = 12f)
                }
            }

            List {
                attr {
                    height(120f)
                    flexDirectionRow()
                    backgroundColor(0xFFFFF3E0)
                    nestedScroll(KRNestedScrollMode.SELF_FIRST, KRNestedScrollMode.SELF_FIRST)
                }
                for (i in 1..20) {
                    View {
                        attr {
                            size(width = 100f, height = 80f)
                            margin(left = 8f, top = 20f)
                            backgroundColor(if (i % 2 == 0) 0xFFFF8A65 else 0xFFFFAB91)
                            borderRadius(8f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("S-Item $i")
                                fontSize(12f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                }
            }

            // Section 3: Horizontal list with SELF_ONLY (no propagation)
            Text {
                attr {
                    text("Section 3: Horizontal SELF_ONLY")
                    fontSize(13f)
                    fontWeightBold()
                    color(0xFF00695C)
                    margin(left = 16f, top = 12f)
                }
            }

            List {
                attr {
                    height(120f)
                    flexDirectionRow()
                    backgroundColor(0xFFE8EAF6)
                    nestedScroll(KRNestedScrollMode.SELF_ONLY, KRNestedScrollMode.SELF_ONLY)
                }
                for (i in 1..20) {
                    View {
                        attr {
                            size(width = 100f, height = 80f)
                            margin(left = 8f, top = 20f)
                            backgroundColor(if (i % 2 == 0) 0xFF7986CB else 0xFF9FA8DA)
                            borderRadius(8f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("O-Item $i")
                                fontSize(12f)
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
