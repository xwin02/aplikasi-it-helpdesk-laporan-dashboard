import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { knowledgeBase } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_CATEGORIES = ['hardware', 'software', 'network', 'access', 'other'] as const;

// Helper function to serialize dates in articles
function serializeArticle(article: any) {
  if (!article) return article;
  
  return {
    ...article,
    createdAt: article.createdAt instanceof Date ? article.createdAt.toISOString() : article.createdAt,
    updatedAt: article.updatedAt instanceof Date ? article.updatedAt.toISOString() : article.updatedAt,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid article ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const article = await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.id, parseInt(id)))
      .limit(1);

    if (article.length === 0) {
      return NextResponse.json(
        { error: 'Article not found', code: 'ARTICLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeArticle(article[0]), { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid article ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const articleId = parseInt(id);

    const existingArticle = await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.id, articleId))
      .limit(1);

    if (existingArticle.length === 0) {
      return NextResponse.json(
        { error: 'Article not found', code: 'ARTICLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, content, category, tags, author, attachments } = body;

    const updates: Record<string, any> = {};

    if (title !== undefined) {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        return NextResponse.json(
          { error: 'Title cannot be empty', code: 'INVALID_TITLE' },
          { status: 400 }
        );
      }
      if (trimmedTitle.length > 255) {
        return NextResponse.json(
          { error: 'Title cannot exceed 255 characters', code: 'TITLE_TOO_LONG' },
          { status: 400 }
        );
      }
      updates.title = trimmedTitle;
    }

    if (content !== undefined) {
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return NextResponse.json(
          { error: 'Content cannot be empty', code: 'INVALID_CONTENT' },
          { status: 400 }
        );
      }
      updates.content = trimmedContent;
    }

    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json(
          {
            error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
            code: 'INVALID_CATEGORY',
          },
          { status: 400 }
        );
      }
      updates.category = category;
    }

    if (tags !== undefined) {
      updates.tags = tags === null ? null : tags.trim();
    }

    if (author !== undefined) {
      const trimmedAuthor = author.trim();
      if (!trimmedAuthor) {
        return NextResponse.json(
          { error: 'Author cannot be empty', code: 'INVALID_AUTHOR' },
          { status: 400 }
        );
      }
      updates.author = trimmedAuthor;
    }

    if (attachments !== undefined) {
      if (attachments === null) {
        updates.attachments = null;
      } else if (typeof attachments === 'string') {
        // Validate JSON string
        try {
          const parsed = JSON.parse(attachments);
          // Only store if it's a non-empty array
          updates.attachments = (Array.isArray(parsed) && parsed.length > 0) ? attachments : null;
        } catch (e) {
          return NextResponse.json(
            { error: 'Attachments must be valid JSON string', code: 'INVALID_ATTACHMENTS_JSON' },
            { status: 400 }
          );
        }
      } else if (Array.isArray(attachments)) {
        // Convert array to JSON string only if not empty
        updates.attachments = attachments.length > 0 ? JSON.stringify(attachments) : null;
      } else {
        return NextResponse.json(
          { error: 'Attachments must be a JSON string or array', code: 'INVALID_ATTACHMENTS' },
          { status: 400 }
        );
      }
    }

    await db
      .update(knowledgeBase)
      .set(updates)
      .where(eq(knowledgeBase.id, articleId));

    // MySQL doesn't support .returning(), so we need to fetch the updated record
    const updated = await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.id, articleId))
      .limit(1);

    return NextResponse.json(serializeArticle(updated[0]), { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid article ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const articleId = parseInt(id);

    const existingArticle = await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.id, articleId))
      .limit(1);

    if (existingArticle.length === 0) {
      return NextResponse.json(
        { error: 'Article not found', code: 'ARTICLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch the record first before deleting
    const articleToDelete = existingArticle[0];

    await db
      .delete(knowledgeBase)
      .where(eq(knowledgeBase.id, articleId));

    return NextResponse.json(
      {
        message: 'Article deleted successfully',
        article: serializeArticle(articleToDelete),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}