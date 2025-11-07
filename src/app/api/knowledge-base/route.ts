import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { knowledgeBase } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

const VALID_CATEGORIES = ['hardware', 'software', 'network', 'access', 'other'] as const;
const MAX_TITLE_LENGTH = 255;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single article by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
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

      return NextResponse.json(article[0], { status: 200 });
    }

    // List articles with filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const tagsParam = searchParams.get('tags');

    let query = db.select().from(knowledgeBase);
    const conditions = [];

    // Search filter
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(knowledgeBase.title, searchTerm),
          like(knowledgeBase.content, searchTerm)
        )
      );
    }

    // Category filter
    if (category) {
      conditions.push(eq(knowledgeBase.category, category));
    }

    // Tags filter (match any tag)
    if (tagsParam) {
      const tags = tagsParam.split(',').map(tag => tag.trim());
      const tagConditions = tags.map(tag => 
        like(knowledgeBase.tags, `%${tag}%`)
      );
      conditions.push(or(...tagConditions));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const articles = await query
      .orderBy(desc(knowledgeBase.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(articles, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, tags, author, attachments } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required and must not be empty', code: 'INVALID_TITLE' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required and must not be empty', code: 'INVALID_CONTENT' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { error: 'Category is required', code: 'INVALID_CATEGORY' },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category as any)) {
      return NextResponse.json(
        { 
          error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`, 
          code: 'INVALID_CATEGORY_VALUE' 
        },
        { status: 400 }
      );
    }

    if (!author || typeof author !== 'string' || author.trim() === '') {
      return NextResponse.json(
        { error: 'Author is required and must not be empty', code: 'INVALID_AUTHOR' },
        { status: 400 }
      );
    }

    // Validate title length
    const trimmedTitle = title.trim();
    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        { 
          error: `Title must not exceed ${MAX_TITLE_LENGTH} characters`, 
          code: 'TITLE_TOO_LONG' 
        },
        { status: 400 }
      );
    }

    // Validate tags if provided
    if (tags !== undefined && tags !== null && typeof tags !== 'string') {
      return NextResponse.json(
        { error: 'Tags must be a string', code: 'INVALID_TAGS' },
        { status: 400 }
      );
    }

    // Validate attachments if provided
    let attachmentsValue = null;
    if (attachments !== undefined && attachments !== null) {
      if (typeof attachments === 'string') {
        // If string, validate it's valid JSON
        try {
          JSON.parse(attachments);
          attachmentsValue = attachments;
        } catch (e) {
          return NextResponse.json(
            { error: 'Attachments must be valid JSON string', code: 'INVALID_ATTACHMENTS_JSON' },
            { status: 400 }
          );
        }
      } else if (Array.isArray(attachments)) {
        // If array, convert to JSON string
        attachmentsValue = JSON.stringify(attachments);
      } else {
        return NextResponse.json(
          { error: 'Attachments must be a JSON string or array', code: 'INVALID_ATTACHMENTS' },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const newArticle = await db
      .insert(knowledgeBase)
      .values({
        title: trimmedTitle,
        content: content.trim(),
        category: category.trim(),
        tags: tags ? tags.trim() : null,
        author: author.trim(),
        attachments: attachmentsValue,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newArticle[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const articleId = parseInt(id);

    // Check if article exists
    const existing = await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.id, articleId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Article not found', code: 'ARTICLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, content, category, tags, author, attachments } = body;

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    // Validate and add title if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json(
          { error: 'Title must not be empty', code: 'INVALID_TITLE' },
          { status: 400 }
        );
      }
      const trimmedTitle = title.trim();
      if (trimmedTitle.length > MAX_TITLE_LENGTH) {
        return NextResponse.json(
          { 
            error: `Title must not exceed ${MAX_TITLE_LENGTH} characters`, 
            code: 'TITLE_TOO_LONG' 
          },
          { status: 400 }
        );
      }
      updates.title = trimmedTitle;
    }

    // Validate and add content if provided
    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim() === '') {
        return NextResponse.json(
          { error: 'Content must not be empty', code: 'INVALID_CONTENT' },
          { status: 400 }
        );
      }
      updates.content = content.trim();
    }

    // Validate and add category if provided
    if (category !== undefined) {
      if (typeof category !== 'string') {
        return NextResponse.json(
          { error: 'Category must be a string', code: 'INVALID_CATEGORY' },
          { status: 400 }
        );
      }
      if (!VALID_CATEGORIES.includes(category as any)) {
        return NextResponse.json(
          { 
            error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`, 
            code: 'INVALID_CATEGORY_VALUE' 
          },
          { status: 400 }
        );
      }
      updates.category = category.trim();
    }

    // Validate and add tags if provided
    if (tags !== undefined) {
      if (tags !== null && typeof tags !== 'string') {
        return NextResponse.json(
          { error: 'Tags must be a string', code: 'INVALID_TAGS' },
          { status: 400 }
        );
      }
      updates.tags = tags ? tags.trim() : null;
    }

    // Validate and add author if provided
    if (author !== undefined) {
      if (typeof author !== 'string' || author.trim() === '') {
        return NextResponse.json(
          { error: 'Author must not be empty', code: 'INVALID_AUTHOR' },
          { status: 400 }
        );
      }
      updates.author = author.trim();
    }

    // Validate and add attachments if provided
    if (attachments !== undefined) {
      if (attachments === null) {
        updates.attachments = null;
      } else if (typeof attachments === 'string') {
        // Validate JSON string
        try {
          JSON.parse(attachments);
          updates.attachments = attachments;
        } catch (e) {
          return NextResponse.json(
            { error: 'Attachments must be valid JSON string', code: 'INVALID_ATTACHMENTS_JSON' },
            { status: 400 }
          );
        }
      } else if (Array.isArray(attachments)) {
        updates.attachments = JSON.stringify(attachments);
      } else {
        return NextResponse.json(
          { error: 'Attachments must be a JSON string or array', code: 'INVALID_ATTACHMENTS' },
          { status: 400 }
        );
      }
    }

    const updated = await db
      .update(knowledgeBase)
      .set(updates)
      .where(eq(knowledgeBase.id, articleId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const articleId = parseInt(id);

    // Check if article exists
    const existing = await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.id, articleId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Article not found', code: 'ARTICLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(knowledgeBase)
      .where(eq(knowledgeBase.id, articleId))
      .returning();

    return NextResponse.json(
      {
        message: 'Article deleted successfully',
        article: deleted[0],
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