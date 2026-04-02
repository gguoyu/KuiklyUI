package com.tencent.kuikly.demo.pages.web_test.interactions

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.PagerScope
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.base.ViewRef
import com.tencent.kuikly.core.directives.vfor
import com.tencent.kuikly.core.nvi.serialization.json.JSONObject
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.reactive.handler.observableList
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.PageList
import com.tencent.kuikly.core.views.PageListView
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

@Page("PageListTestPage")
internal class PageListTestPage : Pager() {
    private var currentIndex by observable(0)
    private var tabItems by observableList<PageTabItem>()
    private var pageItems by observableList<PageSectionItem>()
    private lateinit var pageListRef: ViewRef<PageListView<*, *>>

    override fun created() {
        super.created()
        val colors = listOf(0xFF546E7A, 0xFF1E88E5, 0xFF43A047, 0xFFF4511E)
        repeat(4) { pageIndex ->
            pageItems.add(PageSectionItem(this).apply {
                backgroundColor = Color(colors[pageIndex])
                repeat(30) { listIndex ->
                    dataList.add(PageRowItem(this@PageListTestPage).apply {
                        title = "pageIndex:${pageIndex} listIndex:${listIndex}"
                    })
                }
            })
            tabItems.add(PageTabItem().apply {
                index = pageIndex
                title = "tab${pageIndex}"
            })
        }
    }

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr { backgroundColor(Color.WHITE) }
            Text {
                attr {
                    text("PageListTestPage")
                    color(Color.BLACK)
                    marginTop(20f)
                    marginLeft(16f)
                }
            }
            View {
                attr {
                    flexDirectionRow()
                    height(56f)
                    justifyContentSpaceEvenly()
                    marginTop(12f)
                }
                vfor({ ctx.tabItems }) { tabItem ->
                    View {
                        attr { allCenter() }
                        Text {
                            attr {
                                text(tabItem.title)
                                color(if (tabItem.index == ctx.currentIndex) Color.RED else Color.BLACK)
                            }
                        }
                        event {
                            click {
                                ctx.pageListRef.view?.setContentOffset(tabItem.index * ctx.pageData.pageViewWidth, 0f, true)
                            }
                        }
                    }
                }
            }
            PageList {
                ref { ctx.pageListRef = it }
                attr {
                    flex(1f)
                    pageDirection(true)
                    pageItemWidth(ctx.pageData.pageViewWidth)
                    pageItemHeight(ctx.pageData.pageViewHeight - 88f)
                    showScrollerIndicator(false)
                    keepItemAlive(true)
                }
                vfor({ ctx.pageItems }) { pageItem ->
                    List {
                        attr { backgroundColor(pageItem.backgroundColor) }
                        vfor({ pageItem.dataList }) { row ->
                            View {
                                attr {
                                    height(64f)
                                    allCenter()
                                    margin(left = 16f, right = 16f, top = 8f)
                                    backgroundColor(0x33FFFFFF)
                                }
                                Text {
                                    attr {
                                        text(row.title)
                                        color(Color.WHITE)
                                    }
                                }
                            }
                        }
                    }
                }
                event { pageIndexDidChanged { ctx.currentIndex = (it as JSONObject).optInt("index") } }
            }
        }
    }
}

internal class PageTabItem {
    var index: Int = 0
    var title: String = ""
}

internal class PageSectionItem(scope: PagerScope) {
    var backgroundColor: Color = Color.BLACK
    var dataList by scope.observableList<PageRowItem>()
}

internal class PageRowItem(scope: PagerScope) {
    var title by scope.observable("")
}
